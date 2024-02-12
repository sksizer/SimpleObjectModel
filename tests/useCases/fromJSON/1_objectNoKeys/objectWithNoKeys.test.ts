import { expect, it, test } from 'vitest';
import { getContext } from '@/index';
import emptyData from './data.json';

it('will have no side effects', () => {
  let db = getContext();
  expect(db).not.toBeNull();
  expect(() => {
    db.loadFromObject(emptyData);
  }).not.toThrowError();
  expect(db.getTypes().length).toEqual(0);
});
