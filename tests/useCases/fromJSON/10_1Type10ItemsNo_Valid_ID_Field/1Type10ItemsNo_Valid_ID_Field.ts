import { describe, expect, test } from 'vitest';
import data from './data.json';
import { getContext } from '@/index';

describe('Items with no key field', () => {
  let db = getContext();
  test('Can instantiate', () => {
    expect(() => {
      db.loadFromObject(data);
    }).not.toThrowError();
  });
  test('Has one table', () => {
    expect(db.getTypes().length).to.equal(1);
  });
  test('Table has 10 items', () => {
    expect(db.getTypeStore('type1')?.count()).to.equal(10);
  });
});
