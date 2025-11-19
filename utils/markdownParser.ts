import { PersonalItem, Tag } from '../types';

export interface ParsedMarkdownItem {
    title: string;
    content: string;
    type: 'note' | 'task';
    tags: string[];
    dueDate?: string;
    isCompleted?: boolean;
    subTasks?: Array<{ title: string; isCompleted: boolean }>;
    metadata?: Record<string, any>;
}

/**
 * Parse Obsidian-style frontmatter (YAML)
 */
const parseFrontmatter = (text: string): { metadata: Record<string, any>; content: string } => {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = text.match(frontmatterRegex);

    if (!match) {
        return { metadata: {}, content: text };
    }

    const [, frontmatter, content] = match;
    const metadata: Record<string, any> = {};

    // Parse YAML-like frontmatter
    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value: any = line.substring(colonIndex + 1).trim();

            // Handle arrays [tag1, tag2]
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value
                    .slice(1, -1)
                    .split(',')
                    .map(v => v.trim().replace(/['"]/g, ''));
            }
            // Handle dates
            else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                // Keep as string for now
            }
            // Remove quotes
            else {
                value = value.replace(/^['"]|['"]$/g, '');
            }

            metadata[key] = value;
        }
    });

    return { metadata, content: content.trim() };
};

/**
 * Extract tasks from markdown content
 */
const extractTasks = (content: string): Array<{ title: string; isCompleted: boolean }> => {
    const taskRegex = /^- \[([ xX])\] (.+)$/gm;
    const tasks: Array<{ title: string; isCompleted: boolean }> = [];
    let match;

    while ((match = taskRegex.exec(content)) !== null) {
        tasks.push({
            title: match[2].trim(),
            isCompleted: match[1].toLowerCase() === 'x',
        });
    }

    return tasks;
};

/**
 * Extract tags from content (#tag or [[wikilink]])
 */
const extractTags = (content: string): string[] => {
    const tags = new Set<string>();

    // Extract #hashtags
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
        tags.add(match[1]);
    }

    // Extract [[wikilinks]] as tags
    const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
    while ((match = wikilinkRegex.exec(content)) !== null) {
        tags.add(match[1]);
    }

    return Array.from(tags);
};

/**
 * Parse a single markdown file
 */
export const parseMarkdownFile = (filename: string, content: string): ParsedMarkdownItem => {
    const { metadata, content: mainContent } = parseFrontmatter(content);

    // Extract title from first heading or filename
    const titleMatch = mainContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '');

    // Remove title from content if it was extracted
    const contentWithoutTitle = titleMatch
        ? mainContent.replace(/^#\s+.+$/m, '').trim()
        : mainContent;

    // Extract tasks
    const tasks = extractTasks(contentWithoutTitle);

    // Extract tags
    const contentTags = extractTags(contentWithoutTitle);
    const metadataTags = Array.isArray(metadata.tags) ? metadata.tags : [];
    const allTags = [...new Set([...contentTags, ...metadataTags])];

    // Determine type
    const isTask = tasks.length > 0 || metadata.type === 'task';

    // Clean content (remove task markers for cleaner notes)
    const cleanContent = contentWithoutTitle
        .replace(/^- \[([ xX])\] .+$/gm, '') // Remove task lines
        .replace(/\[\[([^\]]+)\]\]/g, '$1') // Convert [[wikilinks]] to plain text
        .trim();

    return {
        title,
        content: cleanContent,
        type: isTask ? 'task' : 'note',
        tags: allTags,
        dueDate: metadata.due || metadata.dueDate || metadata.created,
        isCompleted: metadata.completed === true || metadata.status === 'done',
        subTasks: tasks.length > 0 ? tasks : undefined,
        metadata: {
            ...metadata,
            originalFilename: filename,
        },
    };
};

/**
 * Convert parsed markdown items to PersonalItems
 */
export const convertToPersonalItems = (parsedItems: ParsedMarkdownItem[]): PersonalItem[] => {
    return parsedItems.map(item => {
        const personalItem: PersonalItem = {
            id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type: item.type,
            title: item.title,
            content: item.content,
            createdAt: new Date().toISOString(),
            tags: item.tags.map(name => ({ id: name.toLowerCase(), name })),
        };

        if (item.type === 'task') {
            personalItem.isCompleted = item.isCompleted || false;
            personalItem.dueDate = item.dueDate;
            personalItem.subTasks = item.subTasks;
        }

        if (item.metadata) {
            personalItem.metadata = item.metadata;
        }

        return personalItem;
    });
};

/**
 * Parse multiple markdown files
 */
export const parseMarkdownFiles = async (files: File[]): Promise<PersonalItem[]> => {
    const parsedItems: ParsedMarkdownItem[] = [];

    for (const file of files) {
        try {
            const content = await file.text();
            const parsed = parseMarkdownFile(file.name, content);
            parsedItems.push(parsed);
        } catch (error) {
            console.error(`Error parsing ${file.name}:`, error);
        }
    }

    return convertToPersonalItems(parsedItems);
};
