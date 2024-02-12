function Query(data, queryObject) {
    return data.filter((d) => {
        let match = true;
        Object.keys(queryObject).forEach((key) => {
            if (d[key] !== queryObject[key]) {
                match = false;
            }
        });
        return match;
    });
}

function toCamelCase(...args) {
    // Flatten the array in case an array of strings is passed as any of the arguments
    const words = [].concat(...args);
    // Process each word to create camelCase
    return words
        .map((word, index) => {
        // Split the word into parts (separated by space, underscore, or hyphen)
        let parts = word.split(/[\s-_]+/);
        // Convert the first letter of each part to uppercase (except for the first word)
        return parts
            .map((part, partIndex) => {
            return partIndex === 0 && index === 0
                ? part.toLowerCase()
                : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
            .join('');
    })
        .join('');
}
function isNumber(value) {
    return typeof value === 'number';
}
function normKey(key) {
    if (isNumber(key)) {
        return key;
    }
    return key.toLowerCase();
}
function normalizeTypeName(name) {
    if (name) {
        return name.toLowerCase();
    }
    else {
        throw new Error('normalizeTypeName: name is required');
    }
}

/**
 * `TableError` is a custom error class that extends the built-in `Error` class.
 * It is used to handle errors specific to the `Table` class.
 */
class TypeStoreError extends Error {
    /**
     * The name of the table where the error occurred.
     */
    typeName;
    /**
     * Protected constructor for the `TableError` class.
     * @param {string} typeName - The name of the table where the error occurred.
     * @param {string} message - The error message.
     */
    constructor(typeName, message) {
        super(message);
        this.typeName = typeName;
    }
    /**
     * Static method to create a new `TableError` instance for a repeat key error.
     * @param {string} typeName - The name of the table where the error occurred.
     * @param {string | number} key - The key that is already in the database.
     * @returns {TypeStoreError} - A new `TableError` instance.
     */
    static repeatKeyError(typeName, key) {
        return new TypeStoreError(typeName, `Cannot add item to table ${typeName}, key ${key} already in database.`);
    }
    static itemNotFoundError(tableName, key) {
        return new TypeStoreError(tableName, `Cannot find item: ${key} in table ${tableName}`);
    }
}
/**
 * A holder for a type.
 *
 * Holds schema information and the data of for
 * a type.
 */
class TypeStoreImpl {
    typeDefinition;
    _name; // convenience
    // Stores items
    _itemMap = new Map();
    constructor(typeDefinition) {
        this.typeDefinition = typeDefinition;
        this._name = typeDefinition.name;
    }
    add(item) {
        if (this._itemMap.has(normKey(item._k))) {
            throw TypeStoreError.repeatKeyError(this._name, item._k);
        }
        this._itemMap.set(normKey(item._k), item);
        return this;
    }
    has(key) {
        return this._itemMap.has(key);
    }
    get(key) {
        if (!this._itemMap.has(key)) {
            throw TypeStoreError.itemNotFoundError(this._name, key);
        }
        return this._itemMap.get(normKey(key));
    }
    count = () => this._itemMap.size;
    query(params) {
        if (params) {
            return Query(Array.from(this._itemMap.values()), params);
        }
        else {
            return Array.from(this._itemMap.values());
        }
    }
}

const defaultConfiguration = {
    mode: 'loose',
    ingres: {
        simple: {
            idKey: '_k',
            metadataKey: '_metadata',
            dataKey: 'data',
        },
    },
};
function getDefaultConfiguration() {
    return { ...defaultConfiguration };
}
let configuration = getDefaultConfiguration();
function getConfiguration() {
    return { ...configuration };
}

/**
 * Built in transformations.
 */
const Transforms = {
    DATE: 'date',
};
//-------------------------
// RELATIONSHIPS / LINKING
//-------------------------
const RelationshipType = {
    OneToOne: 0,
    OneToMany: 1,
};
// Consumption API

function getRelTypeFromKey(key) {
    if (key.endsWith('_s')) {
        return RelationshipType.OneToMany;
    }
    else {
        return RelationshipType.OneToOne;
    }
}
/**
 * @param object
 */
function getInstanceRelationshipDefinitions(object, configuration = getConfiguration()) {
    if (configuration.mode == 'strict') {
        if (Object.keys(object).length == 0) {
            throw new Error('Cannot get relationship definitions from an empty object');
        }
    }
    let fields = [];
    for (let key in object) {
        if (configuration.ingres.simple.idKey === normKey(key)) {
            break;
        }
        if (key.startsWith('_')) {
            let partialRelField = {
                _fieldName: key,
                type: getRelTypeFromKey(key),
                value: object[key],
            };
            if (key.split('_').length == 2) {
                // Simple scenario where the field is the target table name
                // IE _user: 1 means this field indicates a one to one link to the user table of object key == 1
                partialRelField.targetTableName = key.split('_')[1];
                partialRelField.propName = key.split('_')[1];
            }
            else if (key.endsWith('_s') && key.split('_').length == 3) {
                // Scenario where the field is the target table name
                // IE _users_s: [1,2,3] means this field indicates a one to many link to the user table of objects key == 1,2,3
                partialRelField.targetTableName = key.split('_')[1];
                partialRelField.propName = key.split('_')[1] + 's';
            }
            else if (!key.endsWith('_s') && key.split('_').length == 3) {
                // Scenario where there is a semantic field name part and then the target table part
                // eg _start_date: 1 means create a link of name startDate to table Date item with key 1
                partialRelField.targetTableName = key.split('_')[2];
                partialRelField.propName = toCamelCase(key.split('_')[1], key.split('_')[2]);
            }
            else {
                throw new Error(`Invalid relationship field ${key}`);
            }
            fields.push(partialRelField);
        }
    }
    return fields;
}
function hydrateRelationships(db) {
    db.getTypes().forEach((tableName) => {
        let table = db.getTypeStore(tableName);
        let data = table.query();
        data.forEach((item) => {
            let links = getInstanceRelationshipDefinitions(item);
            links.forEach((field) => {
                let targetTable = db.getTypeStore(field.targetType);
                if (field.type == RelationshipType.OneToOne) {
                    let targetItem = targetTable.get(field.value);
                    if (!targetItem) {
                        throw new ContextError(`Relationship ${tableName}:${field.propName} to ${field.targetType} failed. Did not find ${field.value} in table ${field.targetType}`);
                    }
                    item[field.propName] = targetItem;
                    // Add item to related item related object array
                    if (!targetItem.related) {
                        targetItem.related = {};
                    }
                    if (!targetItem.related.hasOwnProperty(tableName)) {
                        targetItem.related[tableName] = [];
                    }
                    targetItem.related[tableName].push(item);
                    // Update Metadata
                    item[field.propName] = targetItem;
                }
                else if (field.type == RelationshipType.OneToMany) {
                    item[field.propName] = [];
                    field.value.forEach((relKey) => {
                        let relItem = targetTable.get(relKey);
                        if (!relItem) {
                            throw new ContextError(`Relationship ${field.propName} not found for ${tableName}._k ${item._k} to ${field.value}`);
                        }
                        // Add item to related item related object array
                        if (!relItem.related) {
                            relItem.related = {};
                        }
                        if (!relItem.related.hasOwnProperty(tableName)) {
                            relItem.related[tableName] = [];
                        }
                        relItem.related[tableName].push(item);
                        item[field.propName].push(relItem);
                        // Update Metadata
                    });
                }
            });
        });
    });
}

class TransformationError extends Error {
    constructor(message) {
        super(message);
    }
    static transformNotRegisteredError(tableName, transform) {
        return new TransformationError(`Transform ${transform.transform} for field ${transform.sourceField} not registered for table ${tableName}`);
    }
    static invalidInputTransformError(data) {
        return new TransformationError(`Invalid input transform for data ${data}`);
    }
}
function getInputTransforms(data) {
    let transforms = [];
    if (data?.metadata?.transforms && Array.isArray(data?.metadata?.transforms)) {
        data.metadata.transforms.forEach((transform) => {
            if (transform.transform &&
                transform.sourceField &&
                transform.targetField) {
                transforms.push(transform);
            }
            else {
                throw TransformationError.invalidInputTransformError(data);
            }
        });
    }
    return transforms;
}
function transformData(db) {
    db.getTypes().forEach((tableName) => {
        let table = db.getTypeStore(tableName);
        let data = table.query();
        table.typeDefinition.transforms.forEach((transform) => {
            data.forEach((item) => {
                if (item.hasOwnProperty(transform.sourceField)) {
                    switch (transform.transform) {
                        case Transforms.DATE:
                            item[transform.targetField] = new Date(item[transform.sourceField]);
                            break;
                        default:
                            throw TransformationError.transformNotRegisteredError(tableName, transform);
                    }
                }
            });
        });
    });
}

function getNodeType(data, configuration = getConfiguration()) {
    if (configuration.mode === 'strict' &&
        (data === null || data === undefined)) {
        throw new Error('getNodeType: data is null or undefined');
    }
    if (data === null || data === undefined) {
        return 'value';
    }
    try {
        if (configuration.ingres.simple.idKey in data) {
            return 'dataInstance';
        }
        if (configuration.ingres.simple.metadataKey in data ||
            configuration.ingres.simple.dataKey in data) {
            return 'dataContainer';
        }
        return 'object';
    }
    catch (e) {
        return 'value';
    }
}
function getNodeData(data) {
    let type = getNodeType(data);
    switch (type) {
        case 'dataInstance':
            return {
                type: 'dataInstance',
                data: data,
            };
        case 'dataContainer':
            return {
                type: 'dataContainer',
                data: data,
            };
        case 'object':
            return {
                type: 'object',
                data: data,
            };
        case 'value':
            return {
                type: 'value',
                data: null,
            };
    }
}
/**
 * Fills in an ORM Context with data from an object
 * @param orm : Context
 * @param data : any
 */
function loadORMFromData(orm, data) {
    _loadORMFromData(orm, getNodeData(data));
}
function _loadORMFromData(orm, data, type = 'unknown') {
    let dT = data;
    if (dT.type === 'value') {
        return;
    }
    if (dT.type === 'dataInstance') {
        orm.getTypeStore(type).add(data);
    }
    if (dT.type === 'object') {
        for (let key in dT.data) {
            _loadORMFromData(orm, getNodeData(dT.data[key]), key);
        }
    }
    if (dT.type === 'dataContainer') {
        let transformations = getInputTransforms(dT.data);
        let table = orm.registerType({
            name: type,
            transforms: transformations,
        });
        if (dT.data.data) {
            let backupCount = 0;
            dT.data.data.forEach((item) => {
                if (item._k === undefined) {
                    item._k = backupCount++;
                }
                table.add(item);
            });
        }
    }
    hydrateRelationships(orm);
    transformData(orm);
}

class ContextError extends Error {
    constructor(message) {
        super(message);
    }
}
/**
 * Provides a context for handling data
 */
class ContextImpl {
    _mode = 'normal';
    setMode(mode) {
        if (mode === 'strict') {
            this._mode = 'strict';
        }
        else {
            this._mode = 'normal';
        }
    }
    _typeNames = [];
    _typeStores = new Map();
    constructor() { }
    registerType(typeDefinition) {
        let origName = typeDefinition.name;
        let normalizedName = normalizeTypeName(typeDefinition.name);
        if (this._typeStores.has(normalizedName)) {
            throw new ContextError(`Type ${normalizedName} already registered`);
        }
        this._typeNames.push(origName);
        this._typeStores.set(normalizedName, new TypeStoreImpl(typeDefinition));
        return this._typeStores.get(normalizedName);
    }
    hasType(name) {
        name = normalizeTypeName(name);
        return this._typeStores.has(name);
    }
    getTypeStore(name) {
        name = normalizeTypeName(name);
        if (!this.hasType(name)) {
            throw new ContextError(`Table ${name} not registered`);
        }
        return this._typeStores.get(name);
    }
    /**
     * Returns the table names as originally registered (preserves case)
     */
    getTypes() {
        return this._typeNames;
    }
    loadFromObject(obj) {
        loadORMFromData(this, obj);
        hydrateRelationships(this);
        transformData(this);
        return this;
    }
}

function getContext() {
    return new ContextImpl();
}

export { getContext };
