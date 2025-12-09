import { loadSettings } from './settingsService';
import * as dataService from './dataService';
import { generateAiFeedItems, generateMentorContent } from './geminiService';
import { fetchAndParseFeed } from './rssService';
import { fetchNewsForTicker } from './financialsService';
import type { FeedItem, Mentor } from '../types';

/**
 * Generates a stable, unique ID for a feed item based on its content.
 * @param {{ guid: string; link?: string; title: string }} feedItem The item to hash.
 * @returns {string} A hashed ID string.
 */
const generateFeedItemId = (feedItem: { guid: string; link?: string; title: string }): string => {
  const content = feedItem.guid || feedItem.link || feedItem.title;
  if (!content) return `feed-item-${Date.now()}-${Math.random()}`; // Fallback for items with no identifier
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `feed-${Math.abs(hash).toString(16)}`;
};

/**
 * Refreshes all data sources concurrently for maximum efficiency.
 * It fetches data from RSS feeds, financial news, AI content generation, and mentors in parallel.
 * Failed fetches from one source will not block others.
 * @returns {Promise<FeedItem[]>} A promise that resolves to an array of all newly fetched items.
 */
export const refreshAllFeeds = async (): Promise<FeedItem[]> => {
  const settings = loadSettings();
  const [allFeeds, existingItems, allMentors, watchlist] = await Promise.all([
    dataService.getFeeds(),
    dataService.getFeedItems(),
    dataService.getMentors(),
    dataService.getWatchlist(),
  ]);
  const existingItemIds = new Set(existingItems.map(item => item.id));
  const allNewItems: FeedItem[] = [];

  const promises: Promise<any>[] = [];

  // 1. AI Content Generation
  console.log(`[Feed Refresh] AI Sparks: ${settings.aiFeedSettings.isEnabled ? 'enabled' : 'disabled'} (${settings.aiFeedSettings.itemsPerRefresh} per refresh)`);
  console.log(`[Feed Refresh] RSS Feeds: ${allFeeds.length} sources`);

  if (settings.aiFeedSettings.isEnabled && settings.aiFeedSettings.itemsPerRefresh > 0) {
    promises.push(
      generateAiFeedItems(
        settings.aiFeedSettings,
        existingItems.map(i => i.title)
      ).then(generatedData => {
        return generatedData.map((itemData, index) => ({
          id: `ai-${Date.now()}-${index}`,
          type: 'spark' as const,
          title: itemData.title,
          content: itemData.summary_he,
          summary_ai: itemData.summary_he,
          insights: itemData.insights,
          topics: itemData.topics,
          tags: itemData.tags.map(t => ({ id: t, name: t })),
          level: itemData.level,
          estimated_read_time_min: itemData.estimated_read_time_min,
          digest: itemData.digest,
          is_read: false,
          is_spark: true,
          createdAt: new Date().toISOString(),
          source: 'AI_GENERATED',
          source_trust_score: 95,
        }));
      })
    );
  }

  // 2. RSS Feeds
  allFeeds.forEach(feed => {
    promises.push(
      fetchAndParseFeed(feed.url).then(parsedFeed =>
        parsedFeed.items.slice(0, 10).map(item => ({
          id: generateFeedItemId(item),
          type: 'rss' as const,
          title: item.title,
          link: item.link,
          content: item.content,
          is_read: false,
          is_spark: false,
          tags: [],
          createdAt: new Date(item.pubDate).toISOString(),
          source: feed.id,
        }))
      )
    );
  });

  // 3. Financial News
  watchlist.forEach(item => {
    promises.push(
      fetchNewsForTicker(item.ticker, item.type).then(newsItems =>
        newsItems.map(news => ({
          id: `news-${news.id}`,
          type: 'news' as const,
          title: news.headline,
          link: news.url,
          content: news.summary,
          is_read: false,
          is_spark: false,
          tags: [{ id: item.ticker, name: item.ticker }],
          createdAt: new Date(news.datetime * 1000).toISOString(),
          source: item.ticker,
        }))
      )
    );
  });

  // Execute all fetches in parallel and handle results
  const results = await Promise.allSettled(promises);

  results.forEach(result => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      result.value.forEach((newItem: FeedItem) => {
        if (!existingItemIds.has(newItem.id)) {
          allNewItems.push(newItem);
          existingItemIds.add(newItem.id);
        }
      });
    } else if (result.status === 'rejected') {
      console.error('A data source failed to refresh:', result.reason);
    }
  });

  // 4. Mentor Feeds (sync, no network)
  const enabledMentors = allMentors.filter(m => settings.enabledMentorIds.includes(m.id));
  const today = new Date().toDateString();
  for (const mentor of enabledMentors) {
    if (mentor.quotes?.length > 0) {
      const hasPostedToday = existingItems.some(
        item =>
          item.source === `mentor:${mentor.id}` && new Date(item.createdAt).toDateString() === today
      );
      if (!hasPostedToday) {
        const quote = mentor.quotes[new Date().getDate() % mentor.quotes.length];
        const newItem: FeedItem = {
          id: `mentor-${mentor.id}-${new Date().toISOString().split('T')[0]}`,
          type: 'mentor',
          title: `ציטוט מאת ${mentor.name}`,
          content: quote || '',
          is_read: false,
          is_spark: false,
          tags: [],
          createdAt: new Date().toISOString(),
          source: `mentor:${mentor.id}`,
        };
        if (!existingItemIds.has(newItem.id)) allNewItems.push(newItem);
      }
    }
  }

  // Save all newly collected items to the database in one batch
  if (allNewItems.length > 0) {
    await dataService.saveFeedItems(allNewItems);
  }

  return allNewItems;
};

export const addCustomMentor = async (name: string): Promise<Mentor> => {
  const quotes = await generateMentorContent(name);
  if (quotes.length === 0) throw new Error('Could not generate content for this mentor.');
  const newMentor: Mentor = {
    id: `custom-${Date.now()}`,
    name,
    description: 'Custom AI-powered mentor',
    isCustom: true,
    quotes,
  };
  await dataService.reAddCustomMentor(newMentor);
  return newMentor;
};

export const refreshMentorContent = async (mentorId: string): Promise<Mentor> => {
  const mentors = await dataService.getMentors();
  const mentor = mentors.find(m => m.id === mentorId);
  if (!mentor || !mentor.isCustom) throw new Error('Mentor not found or not a custom mentor.');
  const newQuotes = await generateMentorContent(mentor.name);
  if (newQuotes.length === 0) throw new Error('Could not refresh content.');
  const updatedMentor = { ...mentor, quotes: newQuotes };
  await dataService.reAddCustomMentor(updatedMentor);
  return updatedMentor;
};
