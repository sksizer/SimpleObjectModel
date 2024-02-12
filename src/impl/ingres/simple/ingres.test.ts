import { describe, expect, it } from 'vitest';
import { getNodeType } from './';

describe('Analyze Object', () => {
  describe('Get Node Type', () => {
    it('should return type of DataInstance', () => {
      let data = {
        _k: 1,
      };
      expect(getNodeType(data)).toBe('dataInstance');
    });
    it('should return type of DataContainer', () => {
      let data: any = {
        _metadata: {},
        data: [],
      };
      expect(getNodeType(data)).toBe('dataContainer');
      data = {
        _metadata: {},
      };
      expect(getNodeType(data)).toBe('dataContainer');
      data = {
        data: [],
      };
      expect(getNodeType(data)).toBe('dataContainer');
    });
    it('should return type of object', () => {
      let data = {
        name: 'test',
      };
      expect(getNodeType(data)).toBe('object');
    });
  });
});
