import type { FeedItem } from '../types';
import { fetchAsText } from './apiService';

// A list of public CORS proxies to improve reliability.
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-proxy.fringe.zone/',
];

export interface ParsedFeedItem {
    title: string;
    link: string;
    content: string;
    pubDate: string;
    guid: string;
}

export interface ParsedFeed {
    title: string;
    items: ParsedFeedItem[];
}

/**
 * Safely strips HTML tags from a string to get plain text while preserving structure.
 * It uses DOMParser for robust parsing and converts list items to markdown-style bullets.
 * This function is critical for cleaning up messy RSS content for AI summarization.
 * 
 * @param {string} htmlString The string containing HTML.
 * @returns {string} The plain text content with paragraph structure.
 * 
 * @unittest
 * // Should remove basic tags
 * const html1 = '<p>Hello <b>World</b></p>';
 * expect(stripHtml(html1)).toBe('Hello World');
 * 
 * // Should convert lists to bullet points
 * const html2 = '<ul><li>One</li><li>Two</li></ul>';
 * expect(stripHtml(html2)).toBe('• One\n• Two');
 * 
 * // Should handle complex and broken HTML gracefully
 * const html3 = '<div>Some text <script>alert("xss")</script> and more <p>content.';
 * expect(stripHtml(html3)).not.toContain('alert');
 */
const stripHtml = (htmlString: string): string => {
    try {
        if (!htmlString) return '';
        const doc = new DOMParser().parseFromString(htmlString, 'text/html');

        doc.querySelectorAll('script, style, link, iframe, noscript').forEach(el => el.remove());

        doc.querySelectorAll('li').forEach(li => {
            const prefix = document.createTextNode('\n• ');
            li.prepend(prefix);
        });
        
        doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, blockquote, tr, hr').forEach(el => {
             el.append('\n');
        });
        
        const text = doc.body.textContent || "";
        
        return text
            .replace(/[ \t]+/g, ' ') 
            .replace(/(\n\s*){3,}/g, '\n\n') 
            .trim();
    } catch (e) {
        console.error("Could not parse HTML string", e);
        return htmlString.replace(/<[^>]+>/g, '').trim();
    }
};


/**
 * Pre-processes the XML string to fix common feed issues before parsing.
 * This increases the reliability of parsing feeds from various non-standard sources.
 * @param {string} xmlString The raw XML string.
 * @returns {string} A sanitized XML string.
 */
const sanitizeXmlBeforeParsing = (xmlString: string): string => {
    let sanitized = xmlString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Remove control characters
    sanitized = sanitized.replace(/&(?!(?:[a-z]+|#[0-9]+);)/gi, '&amp;'); // Fix unescaped ampersands
    sanitized = sanitized.replace(/([<\s][a-zA-Z0-9:-]+)=((?![ '"])[^\s>]+)/g, '$1="$2"'); // Fix unquoted attributes
    sanitized = sanitized.replace(/<(\/?)([\w-]+):([\w-]+)/g, '<$1$3'); // Remove namespaces from tags
    sanitized = sanitized.replace(/\sxmlns(:\w+)?="[^"]+"/g, ''); // Remove namespace definitions
    return sanitized;
};


/**
 * Parses an XML string into a structured feed object using the browser's DOMParser.
 * It's safer and more robust than using regular expressions and supports both RSS and Atom formats.
 * @param {string} xmlString The raw XML content of the feed.
 * @param {string} feedUrl The original URL, used for error reporting.
 * @returns {ParsedFeed} A ParsedFeed object containing the channel title and a list of items.
 * @throws {Error} if the XML is unparseable.
 */
const parseRssXml = (xmlString: string, feedUrl: string): ParsedFeed => {
    const sanitizedXmlString = sanitizeXmlBeforeParsing(xmlString);
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedXmlString, "application/xml");
    
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
        console.error(`XML parsing error for ${feedUrl}:`, errorNode.textContent);
        throw new Error(`Failed to parse XML for feed: ${new URL(feedUrl).hostname}`);
    }

    const channelTitle = doc.querySelector('channel > title, feed > title')?.textContent || 'Untitled Feed';
    const items: ParsedFeedItem[] = [];
    
    // RSS <item> tags
    doc.querySelectorAll('item').forEach(itemNode => {
        const title = itemNode.querySelector('title')?.textContent || '';
        let link = itemNode.querySelector('link')?.textContent || '';
        const guid = itemNode.querySelector('guid')?.textContent || link || title;
        if (!link && guid.startsWith('http')) link = guid;
        
        const rawContent = itemNode.querySelector('encoded, content\\:encoded, description')?.textContent || '';
        const content = stripHtml(rawContent);
        const pubDate = itemNode.querySelector('pubDate')?.textContent || new Date().toISOString();
        items.push({ title, link, content: content.trim(), pubDate, guid });
    });
    
    // Atom <entry> tags
    if (items.length === 0) {
        doc.querySelectorAll('entry').forEach(itemNode => {
            const title = itemNode.querySelector('title')?.textContent || '';
            let link = itemNode.querySelector('link')?.getAttribute('href') || '';
            const guid = itemNode.querySelector('id')?.textContent || link || title;
             if (!link && guid.startsWith('http')) link = guid;

            const rawContent = itemNode.querySelector('content')?.textContent || itemNode.querySelector('summary')?.textContent || '';
            const content = stripHtml(rawContent);
            const pubDate = itemNode.querySelector('updated')?.textContent || itemNode.querySelector('published')?.textContent || new Date().toISOString();
            items.push({ title, link, content: content.trim(), pubDate, guid });
        });
    }

    return { title: channelTitle, items };
};

/**
 * Fetches a single RSS feed using a list of CORS proxies for reliability and parses it.
 * This modular function encapsulates the entire process for a single feed.
 * @param {string} feedUrl The URL of the RSS feed to fetch.
 * @returns {Promise<ParsedFeed>} A promise that resolves to a ParsedFeed object.
 * @throws {ApiError} from `fetchAsText` if all proxies fail.
 */
export const fetchAndParseFeed = async (feedUrl: string): Promise<ParsedFeed> => {
    if (!feedUrl) throw new Error("URL is required to fetch a feed.");
    
    for (const proxy of CORS_PROXIES) {
        try {
            let urlToProxy = feedUrl;
            if (proxy.includes('allorigins.win')) {
                urlToProxy = encodeURIComponent(feedUrl);
            }
            const fetchUrl = `${proxy}${urlToProxy}`;
            const xmlString = await fetchAsText(fetchUrl);
            return parseRssXml(xmlString, feedUrl);
        } catch (error) {
            console.warn(`Error fetching or parsing with proxy ${proxy} for ${feedUrl}:`, error);
        }
    }
    
    throw new Error(`Failed to fetch feed from all proxies: ${feedUrl}`);
};
