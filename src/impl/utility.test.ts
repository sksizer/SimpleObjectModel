import { toCamelCase, isNumber, normKey, normalizeTypeName } from './utility';
import { describe, expect, it } from 'vitest';

describe('Utility Functions', () => {
  describe('toCamelCase', () => {
    it('should convert a single word to camelCase', () => {
      expect(toCamelCase('hello')).toBe('hello');
    });

    it('should convert multiple words to camelCase', () => {
      expect(toCamelCase('hello', 'world')).toBe('helloWorld');
    });

    it('should handle words separated by spaces, underscores, or hyphens', () => {
      expect(toCamelCase('hello-world_lovely day')).toBe('helloWorldLovelyDay');
    });

    it('should handle an array of words', () => {
      expect(toCamelCase(['hello', 'world'])).toBe('helloWorld');
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(123)).toBe(true);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
    });
  });

  describe('normKey', () => {
    it('should return the same value for numbers', () => {
      expect(normKey(123)).toBe(123);
    });

    it('should return a lowercase string for strings', () => {
      expect(normKey('HELLO')).toBe('hello');
    });
  });

  describe('normName', () => {
    it('should return a lowercase string', () => {
      expect(normalizeTypeName('HELLO')).toBe('hello');
    });
  });
});
