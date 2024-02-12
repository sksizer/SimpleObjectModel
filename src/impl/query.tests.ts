import { describe, expect, it } from 'vitest';
describe('Query', () => {
  describe('Empty', () => {
    it('should return all', () => {});

    it('should throw an error if a query key is used that does not exist on the data', () => {
      expect(() => {}).toThrowError();
    });
  });
});
