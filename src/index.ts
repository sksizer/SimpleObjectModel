import { DBItem } from '@/impl/types';
import { getContext } from '@/factory';

/**
 * Consumption facing API for the ORM.
 */
interface Context {
  getTypeStore<Type extends DBItem = DBItem>(type: string): TypeStore<Type>;

  // DEFERRED UNTIL USED
  // addDataOfType(type: string, data: DBItem[] | DBItem): Context;
  // fillObject<Type = any>(object: any):  Type;

  getTypes(): string[];

  // TODO - maybe add a strategy parameter here for future.
  loadFromObject(data: any): Context;
}

interface TypeStore<Type extends DBItem = DBItem> {
  count(): number;

  add(data: DBItem): TypeStore;

  has(key: string | number): boolean;

  get(key: string | number): Type;

  query(query?: Query): Type[];
}

/**
 * Query
 */
interface Query {
  [key: string]: any;
}

export { getContext };
export type { Context, DBItem, TypeStore };
