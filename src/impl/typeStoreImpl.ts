import { Query } from './query';
import { DBItem, RuntimeTypeDefinition } from './types';
import { normKey } from './utility';
import { TypeStore } from '@/index';

/**
 * `TableError` is a custom error class that extends the built-in `Error` class.
 * It is used to handle errors specific to the `Table` class.
 */
class TypeStoreError extends Error {
  /**
   * The name of the table where the error occurred.
   */
  public typeName: string;

  /**
   * Protected constructor for the `TableError` class.
   * @param {string} typeName - The name of the table where the error occurred.
   * @param {string} message - The error message.
   */
  protected constructor(typeName: string, message: string) {
    super(message);
    this.typeName = typeName;
  }

  /**
   * Static method to create a new `TableError` instance for a repeat key error.
   * @param {string} typeName - The name of the table where the error occurred.
   * @param {string | number} key - The key that is already in the database.
   * @returns {TypeStoreError} - A new `TableError` instance.
   */
  static repeatKeyError(
    typeName: string,
    key: string | number,
  ): TypeStoreError {
    return new TypeStoreError(
      typeName,
      `Cannot add item to table ${typeName}, key ${key} already in database.`,
    );
  }

  static itemNotFoundError(
    tableName: string,
    key: string | number,
  ): TypeStoreError {
    return new TypeStoreError(
      tableName,
      `Cannot find item: ${key} in table ${tableName}`,
    );
  }
}

/**
 * A holder for a type.
 *
 * Holds schema information and the data of for
 * a type.
 */
class TypeStoreImpl<T extends DBItem = DBItem> implements TypeStore<T> {
  private _name: string; // convenience

  // Stores items
  private _itemMap: Map<string | number, DBItem> = new Map<
    string | number,
    DBItem
  >();

  constructor(public typeDefinition: RuntimeTypeDefinition) {
    this._name = typeDefinition.name;
  }

  add(item: DBItem | any) {
    if (this._itemMap.has(normKey(item._k))) {
      throw TypeStoreError.repeatKeyError(this._name, item._k);
    }
    this._itemMap.set(normKey(item._k), item);
    return this;
  }

  has(key: string | number): boolean {
    return this._itemMap.has(key);
  }

  get(key: string | number): T {
    if (!this._itemMap.has(key)) {
      throw TypeStoreError.itemNotFoundError(this._name, key);
    }
    return this._itemMap.get(normKey(key)) as unknown as T;
  }

  count = (): number => this._itemMap.size;

  query(params?: { [key: string]: any }): T[] {
    if (params) {
      return Query<T>(Array.from(this._itemMap.values()), params);
    } else {
      return Array.from(this._itemMap.values()) as unknown as T[];
    }
  }
}

export { TypeStoreImpl };
