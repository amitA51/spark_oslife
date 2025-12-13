/**
 * Array Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
    groupBy,
    unique,
    at,
    chunk,
    shuffle,
    sortBy,
    findLast,
    removeWhere,
    updateWhere,
    moveItem,
} from '../../utils/array';

describe('groupBy', () => {
    it('should group items by key', () => {
        const items = [
            { type: 'task', title: 'Task 1' },
            { type: 'habit', title: 'Habit 1' },
            { type: 'task', title: 'Task 2' },
        ];

        const grouped = groupBy(items, item => item.type);

        expect(grouped.task).toHaveLength(2);
        expect(grouped.habit).toHaveLength(1);
    });

    it('should handle empty array', () => {
        expect(groupBy([], () => 'key')).toEqual({});
    });
});

describe('unique', () => {
    it('should remove duplicates from primitive array', () => {
        expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should remove duplicates by key function', () => {
        const items = [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
            { id: 1, name: 'A copy' },
        ];

        const result = unique(items, item => item.id);
        expect(result).toHaveLength(2);
    });
});

describe('at', () => {
    it('should get item at positive index', () => {
        expect(at([1, 2, 3], 0)).toBe(1);
        expect(at([1, 2, 3], 2)).toBe(3);
    });

    it('should get item at negative index', () => {
        expect(at([1, 2, 3], -1)).toBe(3);
        expect(at([1, 2, 3], -2)).toBe(2);
    });

    it('should return undefined for empty array', () => {
        expect(at([], 0)).toBe(undefined);
    });
});

describe('chunk', () => {
    it('should split array into chunks', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should return single chunk if size >= length', () => {
        expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });
});

describe('shuffle', () => {
    it('should return array of same length', () => {
        const arr = [1, 2, 3, 4, 5];
        expect(shuffle(arr)).toHaveLength(5);
    });

    it('should not modify original array', () => {
        const arr = [1, 2, 3];
        shuffle(arr);
        expect(arr).toEqual([1, 2, 3]);
    });
});

describe('sortBy', () => {
    it('should sort by key ascending', () => {
        const items = [
            { name: 'B' },
            { name: 'A' },
            { name: 'C' },
        ];

        const sorted = sortBy(items, item => item.name);
        expect(sorted[0]?.name).toBe('A');
        expect(sorted[2]?.name).toBe('C');
    });

    it('should sort by key descending', () => {
        const items = [{ val: 1 }, { val: 3 }, { val: 2 }];

        const sorted = sortBy(items, item => item.val, true);
        expect(sorted[0]?.val).toBe(3);
    });
});

describe('findLast', () => {
    it('should find last matching item', () => {
        const items = [1, 2, 3, 2, 4];
        expect(findLast(items, x => x === 2)).toBe(2);
    });

    it('should return undefined if not found', () => {
        expect(findLast([1, 2, 3], x => x === 5)).toBe(undefined);
    });
});

describe('removeWhere', () => {
    it('should remove items matching predicate', () => {
        const items = [1, 2, 3, 4, 5];
        expect(removeWhere(items, x => x % 2 === 0)).toEqual([1, 3, 5]);
    });
});

describe('updateWhere', () => {
    it('should update items matching predicate', () => {
        const items = [
            { id: 1, done: false },
            { id: 2, done: false },
        ];

        const result = updateWhere(
            items,
            item => item.id === 1,
            item => ({ ...item, done: true })
        );

        expect(result[0]?.done).toBe(true);
        expect(result[1]?.done).toBe(false);
    });
});

describe('moveItem', () => {
    it('should move item to new position', () => {
        expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    });

    it('should not modify original array', () => {
        const arr = [1, 2, 3];
        moveItem(arr, 0, 2);
        expect(arr).toEqual([1, 2, 3]);
    });
});
