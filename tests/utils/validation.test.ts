/**
 * Validation Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
    sanitizeText,
    isValidEmail,
    isValidUrl,
    isValidDate,
    isWithinLength,
    isValidId,
    cleanText,
    validatePersonalItem,
    safeJsonParse,
} from '../../utils/validation';

describe('sanitizeText', () => {
    it('should escape HTML special characters', () => {
        expect(sanitizeText('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
        );
    });

    it('should handle empty strings', () => {
        expect(sanitizeText('')).toBe('');
    });

    it('should handle normal text', () => {
        expect(sanitizeText('Hello World')).toBe('Hello World');
    });
});

describe('isValidEmail', () => {
    it('should validate correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.il')).toBe(true);
    });

    it('should reject invalid emails', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('@domain.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
    });
});

describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
        expect(isValidUrl('https://google.com')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
        expect(isValidUrl('')).toBe(false);
        expect(isValidUrl('not a url')).toBe(false);
        expect(isValidUrl('ftp://server.com')).toBe(false);
    });
});

describe('isValidDate', () => {
    it('should validate correct dates', () => {
        expect(isValidDate('2024-01-01')).toBe(true);
        expect(isValidDate('2024-12-31T23:59:59Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
        expect(isValidDate('')).toBe(false);
        expect(isValidDate('not a date')).toBe(false);
    });
});

describe('isWithinLength', () => {
    it('should validate length within bounds', () => {
        expect(isWithinLength('hello', 1, 10)).toBe(true);
        expect(isWithinLength('', 0, 5)).toBe(true);
    });

    it('should reject length outside bounds', () => {
        expect(isWithinLength('hi', 5, 10)).toBe(false);
        expect(isWithinLength('this is too long', 1, 5)).toBe(false);
    });
});

describe('isValidId', () => {
    it('should validate correct IDs', () => {
        expect(isValidId('p-123')).toBe(true);
        expect(isValidId('template_456')).toBe(true);
        expect(isValidId('abc123')).toBe(true);
    });

    it('should reject invalid IDs', () => {
        expect(isValidId('')).toBe(false);
        expect(isValidId('id with spaces')).toBe(false);
        expect(isValidId('id@with#special')).toBe(false);
    });
});

describe('cleanText', () => {
    it('should trim and collapse whitespace', () => {
        expect(cleanText('  hello   world  ')).toBe('hello world');
        expect(cleanText('\n\ttab and newline\n')).toBe('tab and newline');
    });

    it('should handle empty strings', () => {
        expect(cleanText('')).toBe('');
    });
});

describe('validatePersonalItem', () => {
    it('should pass for valid items', () => {
        const result = validatePersonalItem({
            title: 'Valid Task',
            type: 'task',
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing title', () => {
        const result = validatePersonalItem({
            title: '',
            type: 'task',
        });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail for invalid type', () => {
        const result = validatePersonalItem({
            title: 'Test',
            type: 'invalid_type',
        });
        expect(result.valid).toBe(false);
    });
});

describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
        expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
        expect(safeJsonParse('not json', { default: true })).toEqual({ default: true });
    });
});
