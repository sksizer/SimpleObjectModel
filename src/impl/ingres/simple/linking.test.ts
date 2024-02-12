import { describe, expect, test } from 'vitest';
import { getInstanceRelationshipDefinitions } from './linking';
import { getDefaultConfiguration } from '@/impl/config';

describe('Get linking fields from an instance', () => {
  describe('For empty object it should', () => {
    test('throw an error in strict mode', () => {
      expect(() => {
        getInstanceRelationshipDefinitions(
          {},
          { ...getDefaultConfiguration(), mode: 'strict' },
        );
      }).toThrowError();
    });
    test('it should return no relationship definitions ', () => {
      expect(getInstanceRelationshipDefinitions({})).toEqual([]);
    });
  });
  describe('An object with no relationship fields', () => {
    test('should return no relationship definitions ', () => {
      expect(getInstanceRelationshipDefinitions({ a: 1 })).toEqual([]);
      expect(getInstanceRelationshipDefinitions({ _k: 0, a: 1, b: 2 })).toEqual(
        [],
      );
      expect(getInstanceRelationshipDefinitions({ data: [{ a: 1 }] })).toEqual(
        [],
      );
    });
  });
});
