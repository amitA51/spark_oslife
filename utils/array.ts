/**
 * Array Utilities
 * 
 * Typed helper functions for common array operations.
 */

/**
 * Groups array items by a key
 */
export const groupBy = <T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> => {
    return array.reduce((result, item) => {
        const key = keyFn(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
        return result;
    }, {} as Record<K, T[]>);
};

/**
 * Removes duplicate items from array
 */
export const unique = <T>(array: T[], keyFn?: (item: T) => unknown): T[] => {
    if (!keyFn) {
        return [...new Set(array)];
    }
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

/**
 * Safely gets an item at index (supports negative indices)
 */
export const at = <T>(array: T[], index: number): T | undefined => {
    const len = array.length;
    if (len === 0) return undefined;
    const normalizedIndex = index < 0 ? len + index : index;
    return array[normalizedIndex];
};

/**
 * Splits array into chunks of specified size
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
    if (size <= 0) return [array];
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

/**
 * Shuffles array (Fisher-Yates algorithm)
 */
export const shuffle = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j]!;
        result[j] = temp!;
    }
    return result;
};

/**
 * Sorts array by a key in ascending order
 */
export const sortBy = <T>(
    array: T[],
    keyFn: (item: T) => string | number | Date,
    descending: boolean = false
): T[] => {
    return [...array].sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);

        if (aVal < bVal) return descending ? 1 : -1;
        if (aVal > bVal) return descending ? -1 : 1;
        return 0;
    });
};

/**
 * Finds the first item that matches predicate, starting from the end
 */
export const findLast = <T>(
    array: T[],
    predicate: (item: T) => boolean
): T | undefined => {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i]!)) {
            return array[i];
        }
    }
    return undefined;
};

/**
 * Removes items from array that match predicate (returns new array)
 */
export const removeWhere = <T>(
    array: T[],
    predicate: (item: T) => boolean
): T[] => {
    return array.filter(item => !predicate(item));
};

/**
 * Updates items in array that match predicate
 */
export const updateWhere = <T>(
    array: T[],
    predicate: (item: T) => boolean,
    updater: (item: T) => T
): T[] => {
    return array.map(item => predicate(item) ? updater(item) : item);
};

/**
 * Moves item from one index to another
 */
export const moveItem = <T>(
    array: T[],
    fromIndex: number,
    toIndex: number
): T[] => {
    const result = [...array];
    const [item] = result.splice(fromIndex, 1);
    if (item) {
        result.splice(toIndex, 0, item);
    }
    return result;
};
