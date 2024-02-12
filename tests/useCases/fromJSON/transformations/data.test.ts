import { beforeEach, describe, expect, test } from 'vitest';
import { getContext } from '@/index';
import data from './data.json';
import { Context } from '@/index';

describe('Data Transformations', () => {
  test('Unregistered transformation throws error', () => {
    let db = getContext();
    expect(() => {
      db.loadFromObject({
        type1: {
          metadata: {
            transforms: [
              {
                sourceField: 'sf',
                targetField: 'tf',
                // @ts-ignore
                type: 'nonsense',
              },
            ],
          },
          data: [
            {
              _k: 1,
              sf: 1234,
            },
          ],
        },
      });
    }).toThrowError();
  });
  describe('Date Transformation', () => {
    let db: Context;

    beforeEach(async () => {
      db = getContext();
      db.loadFromObject(data as any);
    });
    test('Fixture Check', () => {
      expect(db.getTypes().length).to.equal(1);
      expect(db.getTypeStore('type1')?.count()).to.equal(3);
    });
    test('Transforms performed on data', () => {
      let table = db.getTypeStore('type1');
      let items = table.query();
      items.forEach((item: any) => {
        expect(item.date).toBeDefined();
        expect((item.date as Date).getFullYear()).toEqual(2017);
      });
    });
  });
});
