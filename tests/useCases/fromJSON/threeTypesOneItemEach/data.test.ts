import { beforeEach, describe, expect, test } from 'vitest';
import { Context, getContext } from '@/index';
import data from './data.json';

describe('3 Type - 1 Item Each', () => {
  let db: Context;
  beforeEach(() => {
    db = getContext();
  });
  test('Can instantiate', () => {
    expect(() => {
      db.loadFromObject(data);
    }).not.toThrowError();
  });
  test('Has three tables', () => {
    db.loadFromObject(data);
    expect(db.getTypes().length).to.equal(3);
  });
  test('Each Table has 1 item', () => {
    db.getTypes().forEach((name) => {
      expect(db.getTypeStore(name)?.count()).to.equal(1);
    });
  });
});

describe('Runtime Stats', () => {
  test('Table Count', () => {
    let db = getContext();
    db.loadFromObject(data);
    expect(db.getTypes().length).to.equal(3);
  });
});
