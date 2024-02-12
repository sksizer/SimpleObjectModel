import { describe, expect, test } from 'vitest';
import { getContext } from '@/index';
import data from './data.json';

describe('1 Type - 0 Items', () => {
  let db = getContext();
  test('Can instantiate', () => {
    expect(() => {
      db.loadFromObject(data);
    }).not.toThrowError();
  });
  test('Has one table', () => {
    expect(db.getTypes().length).to.equal(1);
  });
  test('Table has 0 items', () => {
    expect(db.getTypeStore('type1')?.count()).to.equal(0);
  });
});
