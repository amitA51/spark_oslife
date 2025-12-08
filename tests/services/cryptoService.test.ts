import { describe, it, expect } from 'vitest';
import { generatePassword, generateSalt, ab2b64, b642ab, str2ab, ab2str } from '../../services/cryptoService';

describe('cryptoService', () => {
    describe('Utility Functions', () => {
        it('str2ab and ab2str should be reversible', () => {
            const original = 'Hello, World! שלום!';
            const arrayBuffer = str2ab(original);
            const result = ab2str(arrayBuffer);
            expect(result).toBe(original);
        });

        it('ab2b64 and b642ab should be reversible', () => {
            const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]).buffer;
            const base64 = ab2b64(original);
            const result = b642ab(base64);

            expect(new Uint8Array(result)).toEqual(new Uint8Array(original));
        });
    });

    describe('generateSalt', () => {
        it('should generate salt of specified length', () => {
            const salt16 = generateSalt(16);
            expect(salt16.byteLength).toBe(16);

            const salt32 = generateSalt(32);
            expect(salt32.byteLength).toBe(32);
        });

        it('should generate different salts each time', () => {
            const salt1 = ab2b64(generateSalt(16));
            const salt2 = ab2b64(generateSalt(16));
            expect(salt1).not.toBe(salt2);
        });
    });

    describe('generatePassword', () => {
        it('should generate password of specified length', () => {
            const password = generatePassword({ length: 20 });
            expect(password).toHaveLength(20);
        });

        it('should include numbers when specified', () => {
            const password = generatePassword({
                length: 50,
                numbers: true,
                symbols: false,
                uppercase: false,
                lowercase: false
            });
            expect(password).toMatch(/^[0-9]+$/);
        });

        it('should include lowercase only when specified', () => {
            const password = generatePassword({
                length: 50,
                numbers: false,
                symbols: false,
                uppercase: false,
                lowercase: true
            });
            expect(password).toMatch(/^[a-z]+$/);
        });

        it('should return empty string when no character types selected', () => {
            const password = generatePassword({
                numbers: false,
                symbols: false,
                uppercase: false,
                lowercase: false
            });
            expect(password).toBe('');
        });

        it('should generate different passwords each time', () => {
            const password1 = generatePassword({ length: 20 });
            const password2 = generatePassword({ length: 20 });
            expect(password1).not.toBe(password2);
        });
    });
});
