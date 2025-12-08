/**
 * Date Utilities
 * 
 * Centralized date parsing and formatting utilities
 * to replace duplicated date handling code across components.
 */

/**
 * Safely parse a date string in YYYY-MM-DD format.
 * Returns current date if parsing fails.
 */
export const parseDate = (dateStr?: string): Date => {
    if (!dateStr) return new Date();

    const parts = dateStr.split('-').map(Number);
    const year = parts[0] ?? new Date().getFullYear();
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;

    const date = new Date(year, month - 1, day);

    // Validate the date is valid
    if (isNaN(date.getTime())) {
        return new Date();
    }

    return date;
};

/**
 * Format a date to YYYY-MM-DD string
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Convert a Date to ISO date string (YYYY-MM-DD).
 * Use this instead of: date.toISOString().split('T')[0]
 * 
 * This uses LOCAL timezone instead of UTC, avoiding date shifting.
 */
export const toDateKey = (date: Date = new Date()): string => formatDateToYYYYMMDD(date);

/**
 * Get today's date as YYYY-MM-DD string.
 * Shorthand for toDateKey(new Date()).
 */
export const todayKey = (): string => toDateKey();

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

/**
 * Check if a date is in the past (before today)
 */
export const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
};

/**
 * Check if a date is in the future (after today)
 */
export const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
};

/**
 * Get the start of today (00:00:00)
 */
export const getStartOfToday = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

/**
 * Get the end of today (23:59:59.999)
 */
export const getEndOfToday = (): Date => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};

/**
 * Get the end of tomorrow
 */
export const getEndOfTomorrow = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow;
};

/**
 * Get the end of the week (6 days from today)
 */
export const getEndOfWeek = (): Date => {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
};

/**
 * Format date to Hebrew locale string
 */
export const formatHebrewDate = (date: Date): string => {
    return date.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
};

/**
 * Format date to short Hebrew locale string
 */
export const formatShortHebrewDate = (date: Date): string => {
    return date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
    });
};

/**
 * Calculate the number of days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.round((d2.getTime() - d1.getTime()) / oneDay);
};
