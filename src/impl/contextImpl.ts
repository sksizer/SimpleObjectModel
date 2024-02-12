import { DBItem, RuntimeTypeDefinition } from './types';
import { TypeStoreImpl } from './typeStoreImpl';
import { normalizeTypeName } from './utility';
import { loadORMFromData } from './ingres/simple';
import { hydrateRelationships } from './ingres/simple/linking';
import { transformData } from './transformation';
import { Context, TypeStore } from '@/index';

export class ContextError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Provides a context for handling data
 */
class ContextImpl implements Context {
  private _mode: 'strict' | 'normal' = 'normal';

  setMode(mode: 'strict' | 'normal') {
    if (mode === 'strict') {
      this._mode = 'strict';
    } else {
      this._mode = 'normal';
    }
  }

  private _typeNames: string[] = [];
  private _typeStores: Map<string, TypeStoreImpl<any>> = new Map<
    string,
    TypeStoreImpl<any>
  >();

  constructor() {}

  registerType<Type extends DBItem = DBItem>(
    typeDefinition: RuntimeTypeDefinition,
  ): TypeStoreImpl<Type> {
    let origName = typeDefinition.name;
    let normalizedName = normalizeTypeName(typeDefinition.name);
    if (this._typeStores.has(normalizedName)) {
      throw new ContextError(`Type ${normalizedName} already registered`);
    }
    this._typeNames.push(origName);
    this._typeStores.set(
      normalizedName,
      new TypeStoreImpl<Type>(typeDefinition),
    );
    return this._typeStores.get(normalizedName) as TypeStoreImpl<Type>;
  }

  hasType(name: string): boolean {
    name = normalizeTypeName(name);
    return this._typeStores.has(name);
  }

  getTypeStore<Type extends DBItem = DBItem>(name: string): TypeStore<Type> {
    name = normalizeTypeName(name);
    if (!this.hasType(name)) {
      throw new ContextError(`Table ${name} not registered`);
    }
    return this._typeStores.get(name) as unknown as TypeStore<Type>;
  }

  /**
   * Returns the table names as originally registered (preserves case)
   */
  getTypes(): string[] {
    return this._typeNames;
  }

  loadFromObject(obj: any): Context {
    loadORMFromData(this, obj);
    hydrateRelationships(this);
    transformData(this);
    return this;
  }
}

export { ContextImpl };
