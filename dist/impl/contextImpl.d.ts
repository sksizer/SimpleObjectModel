import { DBItem, RuntimeTypeDefinition } from './types';
import { TypeStoreImpl } from './typeStoreImpl';
import { Context, TypeStore } from '@/index';
export declare class ContextError extends Error {
    constructor(message: string);
}
/**
 * Provides a context for handling data
 */
declare class ContextImpl implements Context {
    private _mode;
    setMode(mode: 'strict' | 'normal'): void;
    private _typeNames;
    private _typeStores;
    constructor();
    registerType<Type extends DBItem = DBItem>(typeDefinition: RuntimeTypeDefinition): TypeStoreImpl<Type>;
    hasType(name: string): boolean;
    getTypeStore<Type extends DBItem = DBItem>(name: string): TypeStore<Type>;
    /**
     * Returns the table names as originally registered (preserves case)
     */
    getTypes(): string[];
    loadFromObject(obj: any): Context;
}
export { ContextImpl };
