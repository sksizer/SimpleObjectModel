import { DBItem } from '@/impl/types';
import { getContext } from '@/factory';
/**
 * Consumption facing API for the ORM.
 */
interface Context {
    getTypeStore<Type extends DBItem = DBItem>(type: string): TypeStore<Type>;
    getTypes(): string[];
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
