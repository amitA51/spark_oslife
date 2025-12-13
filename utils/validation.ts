/**
 * Validation Utilities
 * 
 * Common validation functions for input sanitization and data validation.
 * Helps prevent XSS and ensures data integrity.
 */

/**
 * Sanitizes HTML/script content from user input
 */
export const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Validates an email address format
 */
export const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates a URL
 */
export const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

/**
 * Validates a date string
 */
export const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

/**
 * Validates that a string is within length limits
 */
export const isWithinLength = (text: string, min: number, max: number): boolean => {
    const length = text?.length || 0;
    return length >= min && length <= max;
};

/**
 * Validates an ID format (alphanumeric with hyphens)
 */
export const isValidId = (id: string): boolean => {
    if (!id) return false;
    return /^[a-zA-Z0-9-_]+$/.test(id);
};

/**
 * Trims and cleans whitespace from text
 */
export const cleanText = (text: string): string => {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
};

/**
 * Validates personal item data before saving
 */
export const validatePersonalItem = (data: {
    title?: string;
    content?: string;
    type?: string;
}): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
        errors.push('כותרת היא שדה חובה');
    }

    if (data.title && data.title.length > 500) {
        errors.push('הכותרת ארוכה מדי (מקסימום 500 תווים)');
    }

    if (data.content && data.content.length > 50000) {
        errors.push('התוכן ארוך מדי (מקסימום 50000 תווים)');
    }

    const validTypes = ['task', 'habit', 'note', 'learning', 'project', 'workout', 'journal', 'roadmap', 'anti-goal'];
    if (data.type && !validTypes.includes(data.type)) {
        errors.push('סוג הפריט אינו תקין');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Safely parses JSON with error handling
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
};

/**
 * Validates import data structure
 */
export const validateImportData = (data: unknown): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
        errors.push('נתוני הייבוא אינם תקינים');
        return { valid: false, errors };
    }

    const obj = data as Record<string, unknown>;

    // Check for expected top-level keys
    const expectedKeys = ['personalItems', 'settings', 'version'];
    const hasRequiredKeys = expectedKeys.some(key => key in obj);

    if (!hasRequiredKeys) {
        errors.push('מבנה קובץ הייבוא אינו תקין');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};
