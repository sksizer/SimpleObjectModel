import { DBItem } from './types';
import { beforeEach, describe, expect, it } from 'vitest';
import { TypeStoreImpl } from '@/impl/typeStoreImpl';

describe('Table', () => {
  let table: TypeStoreImpl<DBItem>;

  beforeEach(() => {
    table = new TypeStoreImpl<DBItem>({ name: 'testTable', transforms: [] });
  });

  it('should add an item to the table', () => {
    const item: DBItem = { _k: 'key1', _v: 'value1' };
    table.add(item);
    expect(table.get('key1')).toEqual(item);
  });

  it('should throw an error when adding an item with a duplicate key', () => {
    const item: DBItem = { _k: 'key1', _v: 'value1' };
    table.add(item);
    expect(() => table.add(item)).toThrow();
  });

  it('should throw error when getting an item with a non-existent key', () => {
    expect(() => {
      table.get('nonExistentKey');
    }).toThrowError();
  });

  it('should return the correct count of items', () => {
    const item1: DBItem = { _k: 'key1', _v: 'value1' };
    const item2: DBItem = { _k: 'key2', _v: 'value2' };
    table.add(item1);
    table.add(item2);
    expect(table.count()).toBe(2);
  });

  it('should return all items when querying without parameters', () => {
    const item1: DBItem = { _k: 'key1', _v: 'value1' };
    const item2: DBItem = { _k: 'key2', _v: 'value2' };
    table.add(item1);
    table.add(item2);
    expect(table.query()).toEqual([item1, item2]);
  });

  it('should return filtered items when querying with parameters', () => {
    const item1: DBItem = { _k: 'key1', _v: 'value1', type: 'type1' };
    const item2: DBItem = { _k: 'key2', _v: 'value2', type: 'type2' };
    table.add(item1);
    table.add(item2);
    expect(table.query({ type: 'type1' })).toEqual([item1]);
  });
});
