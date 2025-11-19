import { PersonalItem } from '../types';

export interface NotionPage {
    object: 'page';
    properties: Record<string, any>;
    children?: NotionBlock[];
}

export interface NotionBlock {
    type: string;
    [key: string]: any;
}

/**
 * Extract text from Notion rich text array
 */
const extractRichText = (richTextArray: any[]): string => {
    if (!Array.isArray(richTextArray)) return '';
    return richTextArray.map(rt => rt.plain_text || rt.text?.content || '').join('');
};

/**
 * Extract title from Notion properties
 */
const extractTitle = (properties: Record<string, any>): string => {
    // Look for title property
    for (const [key, value] of Object.entries(properties)) {
        if (value.type === 'title' && Array.isArray(value.title)) {
            return extractRichText(value.title);
        }
    }

    // Fallback to Name property
    if (properties.Name) {
        if (properties.Name.type === 'title') {
            return extractRichText(properties.Name.title);
        }
        if (typeof properties.Name === 'string') {
            return properties.Name;
        }
    }

    return 'Untitled';
};

/**
 * Extract tags from Notion properties
 */
const extractTags = (properties: Record<string, any>): string[] => {
    const tags: string[] = [];

    for (const [key, value] of Object.entries(properties)) {
        if (value.type === 'multi_select' && Array.isArray(value.multi_select)) {
            tags.push(...value.multi_select.map((tag: any) => tag.name));
        }
        if (value.type === 'select' && value.select?.name) {
            tags.push(value.select.name);
        }
    }

    return tags;
};

/**
 * Extract date from Notion properties
 */
const extractDate = (properties: Record<string, any>): string | undefined => {
    for (const [key, value] of Object.entries(properties)) {
        if (value.type === 'date' && value.date?.start) {
            return value.date.start;
        }
    }
    return undefined;
};

/**
 * Extract status/completion from Notion properties
 */
const extractStatus = (properties: Record<string, any>): { isCompleted: boolean; status?: string } => {
    for (const [key, value] of Object.entries(properties)) {
        // Check for checkbox
        if (value.type === 'checkbox') {
            return { isCompleted: value.checkbox === true };
        }

        // Check for status select
        if ((key.toLowerCase() === 'status' || value.type === 'status') && value.select?.name) {
            const statusName = value.select.name.toLowerCase();
            return {
                isCompleted: statusName === 'done' || statusName === 'completed',
                status: value.select.name,
            };
        }
    }

    return { isCompleted: false };
};

/**
 * Convert Notion blocks to markdown-like content
 */
const blocksToContent = (blocks: NotionBlock[]): string => {
    if (!Array.isArray(blocks)) return '';

    return blocks.map(block => {
        const type = block.type;

        switch (type) {
            case 'paragraph':
                return extractRichText(block.paragraph?.rich_text || []);

            case 'heading_1':
                return `# ${extractRichText(block.heading_1?.rich_text || [])}`;

            case 'heading_2':
                return `## ${extractRichText(block.heading_2?.rich_text || [])}`;

            case 'heading_3':
                return `### ${extractRichText(block.heading_3?.rich_text || [])}`;

            case 'bulleted_list_item':
                return `- ${extractRichText(block.bulleted_list_item?.rich_text || [])}`;

            case 'numbered_list_item':
                return `1. ${extractRichText(block.numbered_list_item?.rich_text || [])}`;

            case 'to_do':
                const checked = block.to_do?.checked ? 'x' : ' ';
                return `- [${checked}] ${extractRichText(block.to_do?.rich_text || [])}`;

            case 'code':
                const code = extractRichText(block.code?.rich_text || []);
                const language = block.code?.language || '';
                return `\`\`\`${language}\n${code}\n\`\`\``;

            case 'quote':
                return `> ${extractRichText(block.quote?.rich_text || [])}`;

            default:
                return '';
        }
    }).filter(Boolean).join('\n\n');
};

/**
 * Parse a single Notion page
 */
export const parseNotionPage = (page: NotionPage): PersonalItem | null => {
    try {
        const title = extractTitle(page.properties);
        const tags = extractTags(page.properties);
        const dueDate = extractDate(page.properties);
        const { isCompleted, status } = extractStatus(page.properties);
        const content = page.children ? blocksToContent(page.children) : '';

        // Determine type based on content and properties
        const hasTasks = content.includes('- [ ]') || content.includes('- [x]');
        const type = hasTasks || status ? 'task' : 'note';

        const personalItem: PersonalItem = {
            id: `notion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type,
            title,
            content,
            createdAt: new Date().toISOString(),
            tags: tags.map(name => ({ id: name.toLowerCase(), name })),
        };

        if (type === 'task') {
            personalItem.isCompleted = isCompleted;
            personalItem.dueDate = dueDate;
        }

        // Store original Notion data in metadata
        personalItem.metadata = {
            source: 'notion',
            originalProperties: page.properties,
        };

        return personalItem;
    } catch (error) {
        console.error('Error parsing Notion page:', error);
        return null;
    }
};

/**
 * Parse Notion export JSON
 */
export const parseNotionExport = (jsonData: any): PersonalItem[] => {
    const items: PersonalItem[] = [];

    try {
        // Handle different Notion export formats
        let pages: NotionPage[] = [];

        if (Array.isArray(jsonData)) {
            pages = jsonData;
        } else if (jsonData.results && Array.isArray(jsonData.results)) {
            pages = jsonData.results;
        } else if (jsonData.object === 'page') {
            pages = [jsonData];
        }

        for (const page of pages) {
            if (page.object === 'page') {
                const item = parseNotionPage(page);
                if (item) {
                    items.push(item);
                }
            }
        }
    } catch (error) {
        console.error('Error parsing Notion export:', error);
    }

    return items;
};

/**
 * Parse Notion database export
 */
export const parseNotionDatabase = (jsonData: any): PersonalItem[] => {
    const items: PersonalItem[] = [];

    try {
        const pages = jsonData.results || jsonData.pages || [];

        for (const page of pages) {
            const item = parseNotionPage(page);
            if (item) {
                items.push(item);
            }
        }
    } catch (error) {
        console.error('Error parsing Notion database:', error);
    }

    return items;
};
