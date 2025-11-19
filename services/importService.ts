import { PersonalItem } from '../types';
import { parseMarkdownFiles } from '../utils/markdownParser';
import { parseNotionExport, parseNotionDatabase } from '../utils/notionParser';

export type ImportSource = 'obsidian' | 'notion' | 'todoist' | 'trello' | 'markdown';

export interface ImportResult {
    success: boolean;
    itemsImported: number;
    items: PersonalItem[];
    errors: string[];
    warnings: string[];
}

/**
 * Import from Obsidian (Markdown files)
 */
export const importFromObsidian = async (files: File[]): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        itemsImported: 0,
        items: [],
        errors: [],
        warnings: [],
    };

    try {
        const items = await parseMarkdownFiles(files);
        result.items = items;
        result.itemsImported = items.length;
        result.success = true;

        if (items.length === 0) {
            result.warnings.push('לא נמצאו פריטים תקינים לייבוא');
        }
    } catch (error) {
        result.errors.push(`שגיאה בייבוא מ-Obsidian: ${error}`);
    }

    return result;
};

/**
 * Import from Notion (JSON export)
 */
export const importFromNotion = async (jsonData: any): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        itemsImported: 0,
        items: [],
        errors: [],
        warnings: [],
    };

    try {
        // Try parsing as regular export first
        let items = parseNotionExport(jsonData);

        // If no items found, try parsing as database
        if (items.length === 0) {
            items = parseNotionDatabase(jsonData);
        }

        result.items = items;
        result.itemsImported = items.length;
        result.success = items.length > 0;

        if (items.length === 0) {
            result.warnings.push('לא נמצאו דפים תקינים בקובץ Notion');
        }
    } catch (error) {
        result.errors.push(`שגיאה בייבוא מ-Notion: ${error}`);
    }

    return result;
};

/**
 * Import from Todoist (JSON export)
 */
export const importFromTodoist = async (jsonData: any): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        itemsImported: 0,
        items: [],
        errors: [],
        warnings: [],
    };

    try {
        const items: PersonalItem[] = [];
        const todoistItems = jsonData.items || jsonData.tasks || [];

        for (const task of todoistItems) {
            const item: PersonalItem = {
                id: `todoist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                type: 'task',
                title: task.content || task.title || 'Untitled',
                content: task.description || '',
                createdAt: task.added_at || task.created_at || new Date().toISOString(),
                isCompleted: task.checked === 1 || task.is_completed === true,
                dueDate: task.due?.date || task.due_date,
                priority: task.priority === 4 ? 'high' : task.priority >= 2 ? 'medium' : 'low',
                tags: (task.labels || []).map((label: any) => ({
                    id: typeof label === 'string' ? label.toLowerCase() : label.name.toLowerCase(),
                    name: typeof label === 'string' ? label : label.name,
                })),
                metadata: {
                    source: 'todoist',
                    originalId: task.id,
                },
            };

            items.push(item);
        }

        result.items = items;
        result.itemsImported = items.length;
        result.success = true;

        if (items.length === 0) {
            result.warnings.push('לא נמצאו משימות בקובץ Todoist');
        }
    } catch (error) {
        result.errors.push(`שגיאה בייבוא מ-Todoist: ${error}`);
    }

    return result;
};

/**
 * Import from Trello (JSON export)
 */
export const importFromTrello = async (jsonData: any): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        itemsImported: 0,
        items: [],
        errors: [],
        warnings: [],
    };

    try {
        const items: PersonalItem[] = [];
        const cards = jsonData.cards || [];
        const lists = jsonData.lists || [];

        // Create a map of list names
        const listMap = new Map(lists.map((list: any) => [list.id, list.name]));

        for (const card of cards) {
            if (card.closed) continue; // Skip archived cards

            const listName = listMap.get(card.idList);
            const item: PersonalItem = {
                id: `trello-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                type: 'task',
                title: card.name,
                content: card.desc || '',
                createdAt: card.dateLastActivity || new Date().toISOString(),
                isCompleted: listName?.toLowerCase().includes('done') || listName?.toLowerCase().includes('completed'),
                dueDate: card.due,
                tags: (card.labels || []).map((label: any) => ({
                    id: label.name.toLowerCase(),
                    name: label.name,
                })),
                metadata: {
                    source: 'trello',
                    list: listName,
                    originalId: card.id,
                },
            };

            // Add checklist items as subtasks
            if (card.checklists && card.checklists.length > 0) {
                item.subTasks = card.checklists.flatMap((checklist: any) =>
                    (checklist.checkItems || []).map((checkItem: any) => ({
                        id: checkItem.id,
                        title: checkItem.name,
                        isCompleted: checkItem.state === 'complete',
                    }))
                );
            }

            items.push(item);
        }

        result.items = items;
        result.itemsImported = items.length;
        result.success = true;

        if (items.length === 0) {
            result.warnings.push('לא נמצאו כרטיסים בקובץ Trello');
        }
    } catch (error) {
        result.errors.push(`שגיאה בייבוא מ-Trello: ${error}`);
    }

    return result;
};

/**
 * Auto-detect import source from file/data
 */
export const detectImportSource = (data: any, filename?: string): ImportSource | null => {
    // Check filename extension
    if (filename) {
        if (filename.endsWith('.md')) return 'markdown';
        if (filename.endsWith('.json')) {
            // Try to detect JSON type
            if (data.items || data.tasks) return 'todoist';
            if (data.cards && data.lists) return 'trello';
            if (data.object === 'page' || data.results) return 'notion';
        }
    }

    // Check data structure
    if (typeof data === 'object') {
        if (data.items || data.tasks) return 'todoist';
        if (data.cards && data.lists) return 'trello';
        if (data.object === 'page' || data.results) return 'notion';
    }

    return null;
};

/**
 * Generic import function that auto-detects source
 */
export const importData = async (
    data: any,
    source?: ImportSource,
    filename?: string
): Promise<ImportResult> => {
    const detectedSource = source || detectImportSource(data, filename);

    if (!detectedSource) {
        return {
            success: false,
            itemsImported: 0,
            items: [],
            errors: ['לא ניתן לזהות את סוג הקובץ'],
            warnings: [],
        };
    }

    switch (detectedSource) {
        case 'notion':
            return importFromNotion(data);
        case 'todoist':
            return importFromTodoist(data);
        case 'trello':
            return importFromTrello(data);
        default:
            return {
                success: false,
                itemsImported: 0,
                items: [],
                errors: [`סוג ייבוא לא נתמך: ${detectedSource}`],
                warnings: [],
            };
    }
};
