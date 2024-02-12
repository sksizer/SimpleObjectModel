import { DBItem, RuntimeTypeDefinition } from './types';
import { TypeStore } from '@/index';
/**
 * A holder for a type.
 *
 * Holds schema information and the data of for
 * a type.
 */
declare class TypeStoreImpl<T extends DBItem = DBItem> implements TypeStore<T> {
    typeDefinition: RuntimeTypeDefinition;
    private _name;
    private _itemMap;
    constructor(typeDefinition: RuntimeTypeDefinition);
    add(item: DBItem | any): this;
    has(key: string | number): boolean;
    get(key: string | number): T;
    count: () => number;
    query(params?: {
        [key: string]: any;
    }): T[];
}
export { TypeStoreImpl };
