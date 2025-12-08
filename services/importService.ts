/**
 * Import Service
 * Handles data import from various formats (JSON, Obsidian, etc.)
 */

import type { PersonalItem } from '../types';

// Import sources
export type ImportSource = 'obsidian' | 'markdown' | 'notion' | 'todoist' | 'trello' | 'json';

// Import result structure
export interface ImportResult {
    success: boolean;
    itemsImported: number;
    items: PersonalItem[];
    errors: string[];
    warnings: string[];
}

/**
 * Generic import item structure for external data sources
 */
interface ImportedItemBase {
    id?: string;
    type?: string;
    title?: string;
    content?: string;
    name?: string;
    description?: string;
    desc?: string;
    created?: string;
    updated?: string;
    createdAt?: string;
    updatedAt?: string;
    created_time?: string;
    last_edited_time?: string;
    dateLastActivity?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | number;
    isCompleted?: boolean;
    completed?: boolean;
    closed?: boolean;
    tags?: string[];
    labels?: string[] | Array<{ name: string }>;
    properties?: {
        Name?: { title?: Array<{ plain_text: string }> };
        Tags?: { multi_select?: Array<{ name: string }> };
    };
    due?: { date?: string };
}

/**
 * Import data from various sources
 */
export const importData = async (
    data: unknown,
    source: ImportSource,
    _filename: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        itemsImported: 0,
        items: [],
        errors: [],
        warnings: [],
    };

    try {
        // Validate that it's an array
        if (!Array.isArray(data)) {
            result.errors.push('Invalid format: Expected an array of items');
            return result;
        }

        // Process items based on source
        const items: PersonalItem[] = [];
        const errors: string[] = [];

        (data as ImportedItemBase[]).forEach((item: ImportedItemBase, index: number) => {
            try {
                const processedItem = processItemBySource(item, source);
                items.push(processedItem);
            } catch (error) {
                errors.push(`Item ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        result.items = items;
        result.itemsImported = items.length;
        result.errors = errors;
        result.success = items.length > 0;

        if (items.length === 0 && errors.length > 0) {
            result.errors.unshift('No valid items could be imported');
        }

        return result;
    } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Failed to process data');
        return result;
    }
};

/**
 * Process item based on source type
 */
const processItemBySource = (item: ImportedItemBase, source: ImportSource): PersonalItem => {
    switch (source) {
        case 'notion':
            return processNotionItem(item);
        case 'todoist':
            return processTodoistItem(item);
        case 'trello':
            return processTrelloItem(item);
        default:
            return processGenericItem(item);
    }
};

/**
 * Process Notion item
 */
const processNotionItem = (item: ImportedItemBase): PersonalItem => {
    return {
        id: item.id || crypto.randomUUID(),
        type: 'note',
        title: item.properties?.Name?.title?.[0]?.plain_text || item.title || 'Untitled',
        content: item.content || '',
        createdAt: item.created_time || new Date().toISOString(),
        updatedAt: item.last_edited_time || new Date().toISOString(),
        tags: item.properties?.Tags?.multi_select?.map((t: { name: string }) => t.name) || [],
    };
};

/**
 * Process Todoist item
 */
const processTodoistItem = (item: ImportedItemBase): PersonalItem => {
    const priority = typeof item.priority === 'number' ? item.priority : 1;
    return {
        id: item.id?.toString() || crypto.randomUUID(),
        type: 'task',
        title: item.content || item.title || 'Untitled',
        content: item.description || '',
        createdAt: item.created || new Date().toISOString(),
        updatedAt: item.updated || new Date().toISOString(),
        dueDate: item.due?.date,
        priority: priority >= 4 ? 'high' : priority >= 2 ? 'medium' : 'low',
        isCompleted: item.completed || false,
        tags: Array.isArray(item.labels) ? item.labels.filter((l): l is string => typeof l === 'string') : [],
    };
};

/**
 * Process Trello item
 */
const processTrelloItem = (item: ImportedItemBase): PersonalItem => {
    const labels = Array.isArray(item.labels)
        ? item.labels.map((l) => typeof l === 'string' ? l : l.name)
        : [];
    return {
        id: item.id || crypto.randomUUID(),
        type: 'task',
        title: item.name || item.title || 'Untitled',
        content: item.desc || item.description || '',
        createdAt: item.dateLastActivity || new Date().toISOString(),
        updatedAt: item.dateLastActivity || new Date().toISOString(),
        isCompleted: item.closed || false,
        tags: labels,
    };
};

/**
 * Valid PersonalItem types for type validation
 */
const VALID_ITEM_TYPES = [
    'task', 'habit', 'workout', 'note', 'link', 'learning',
    'goal', 'journal', 'book', 'idea', 'gratitude', 'roadmap'
] as const;

type ValidItemType = typeof VALID_ITEM_TYPES[number];

const isValidItemType = (type: unknown): type is ValidItemType => {
    return typeof type === 'string' && VALID_ITEM_TYPES.includes(type as ValidItemType);
};

/**
 * Process generic item
 */
const processGenericItem = (item: ImportedItemBase): PersonalItem => {
    if (!item.id || !item.type || !item.title) {
        throw new Error('Missing required fields (id, type, title)');
    }

    const itemType = isValidItemType(item.type) ? item.type : 'note';

    return {
        id: item.id,
        type: itemType,
        title: item.title,
        content: item.content || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
    };
};

/**
 * Import from Obsidian vault  
 * Converts Obsidian markdown files to PersonalItems
 */
export const importFromObsidian = async (files: File[]): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        itemsImported: 0,
        items: [],
        errors: [],
        warnings: [],
    };

    for (const file of files) {
        // Only process markdown files
        if (!file.name.endsWith('.md')) {
            result.warnings.push(`Skipped ${file.name}: Not a markdown file`);
            continue;
        }

        try {
            const content = await readFileAsText(file);

            // Extract title from filename (remove .md extension)
            const title = file.name.replace(/\.md$/, '');

            // Parse frontmatter if it exists
            const { frontmatter, body } = parseMarkdownWithFrontmatter(content);

            // Create PersonalItem
            const item: PersonalItem = {
                id: crypto.randomUUID(),
                type: determineItemType(frontmatter, body),
                title: frontmatter.title || title,
                content: body,
                createdAt: frontmatter.created || new Date().toISOString(),
                updatedAt: frontmatter.updated || new Date().toISOString(),
                tags: frontmatter.tags || [],
                ...(frontmatter.dueDate && { dueDate: frontmatter.dueDate }),
                ...(frontmatter.priority && { priority: frontmatter.priority }),
            };

            result.items.push(item);
        } catch (error) {
            result.errors.push(`Failed to import ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    result.itemsImported = result.items.length;
    result.success = result.items.length > 0;

    return result;
};



/**
 * Helper: Read file as text
 */
const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

/**
 * Frontmatter data structure from markdown files
 */
interface FrontmatterData {
    title?: string;
    type?: string;
    created?: string;
    updated?: string;
    tags?: string[];
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    [key: string]: unknown;
}

/**
 * Helper: Parse markdown with YAML frontmatter
 */
const parseMarkdownWithFrontmatter = (content: string): { frontmatter: FrontmatterData; body: string } => {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterText = match[1] ?? '';
    const body = match[2] ?? '';
    const frontmatter: FrontmatterData = {};

    // Simple YAML parser (for common fields)
    frontmatterText.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();

            // Handle arrays (tags)
            if (value.startsWith('[') && value.endsWith(']')) {
                frontmatter[key.trim()] = value
                    .slice(1, -1)
                    .split(',')
                    .map((v) => v.trim().replace(/['"]/g, ''));
            } else {
                frontmatter[key.trim()] = value.replace(/['"]/g, '');
            }
        }
    });

    return { frontmatter, body: body.trim() };
};

/**
 * Helper: Determine item type from frontmatter/content
 */
const determineItemType = (frontmatter: FrontmatterData, body: string): PersonalItem['type'] => {
    // Check frontmatter type - validate it's a known type
    if (frontmatter.type && isValidItemType(frontmatter.type)) {
        return frontmatter.type;
    }

    // Heuristics based on content
    if (frontmatter.dueDate || body.includes('- [ ]') || body.includes('- [x]')) {
        return 'task';
    }

    if (body.includes('##') || body.length > 500) {
        return 'note';
    }

    // Default to 'idea' for general imports (closest to 'spark' concept)
    return 'idea';
};

/**
 * Export current data as JSON
 */
export const exportData = (items: PersonalItem[], filename: string = 'sparkos-export.json') => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
