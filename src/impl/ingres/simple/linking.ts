import { normKey, toCamelCase } from '../../utility';
import {
  Configuration,
  DBItem,
  RelationshipType,
  RelationshipTypeValues,
  RuntimeRelationshipDefinition,
} from '../../types';
import { TypeStoreImpl } from '../../typeStoreImpl';
import { ContextImpl, ContextError } from '../../contextImpl';
import { getConfiguration } from '@/impl/config';

type PartialRelField = {
  _fieldName: string;
  type: RelationshipTypeValues;
  value: any;
  targetTableName?: string;
  propName?: string;
};

function getRelTypeFromKey(key: string): RelationshipTypeValues {
  if (key.endsWith('_s')) {
    return RelationshipType.OneToMany;
  } else {
    return RelationshipType.OneToOne;
  }
}

/**
 * @param object
 */
export function getInstanceRelationshipDefinitions(
  object: {
    [key: string]: any;
  },
  configuration: Configuration = getConfiguration(),
): RuntimeRelationshipDefinition[] {
  if (configuration.mode == 'strict') {
    if (Object.keys(object).length == 0) {
      throw new Error(
        'Cannot get relationship definitions from an empty object',
      );
    }
  }

  let fields: RuntimeRelationshipDefinition[] = [];

  for (let key in object) {
    if (configuration.ingres.simple.idKey === normKey(key)) {
      break;
    }

    if (key.startsWith('_')) {
      let partialRelField: PartialRelField = {
        _fieldName: key,
        type: getRelTypeFromKey(key),
        value: object[key],
      };

      if (key.split('_').length == 2) {
        // Simple scenario where the field is the target table name
        // IE _user: 1 means this field indicates a one to one link to the user table of object key == 1
        partialRelField.targetTableName = key.split('_')[1];
        partialRelField.propName = key.split('_')[1];
      } else if (key.endsWith('_s') && key.split('_').length == 3) {
        // Scenario where the field is the target table name
        // IE _users_s: [1,2,3] means this field indicates a one to many link to the user table of objects key == 1,2,3
        partialRelField.targetTableName = key.split('_')[1];
        partialRelField.propName = key.split('_')[1] + 's';
      } else if (!key.endsWith('_s') && key.split('_').length == 3) {
        // Scenario where there is a semantic field name part and then the target table part
        // eg _start_date: 1 means create a link of name startDate to table Date item with key 1
        partialRelField.targetTableName = key.split('_')[2];
        partialRelField.propName = toCamelCase(
          key.split('_')[1],
          key.split('_')[2],
        );
      } else {
        throw new Error(`Invalid relationship field ${key}`);
      }

      fields.push(partialRelField as RuntimeRelationshipDefinition);
    }
  }
  return fields;
}

export function hydrateRelationships(db: ContextImpl) {
  db.getTypes().forEach((tableName: string) => {
    let table = db.getTypeStore(tableName) as TypeStoreImpl<any>;
    let data = table.query();
    data.forEach((item: DBItem) => {
      let links = getInstanceRelationshipDefinitions(item);
      links.forEach((field) => {
        let targetTable = db.getTypeStore(field.targetType);
        if (field.type == RelationshipType.OneToOne) {
          let targetItem: any = targetTable.get(field.value);
          if (!targetItem) {
            throw new ContextError(
              `Relationship ${tableName}:${field.propName} to ${field.targetType} failed. Did not find ${field.value} in table ${field.targetType}`,
            );
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
        } else if (field.type == RelationshipType.OneToMany) {
          item[field.propName] = [];
          field.value.forEach((relKey: string | number) => {
            let relItem: any = targetTable.get(relKey);
            if (!relItem) {
              throw new ContextError(
                `Relationship ${field.propName} not found for ${tableName}._k ${item._k} to ${field.value}`,
              );
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

export class LinkingError extends Error {
  protected constructor(message: string) {
    super(message);
  }

  static relatedFieldError(
    tableName: string,
    key: string | number,
  ): LinkingError {
    return new LinkingError(
      `Object ${key} of type ${tableName} has field 'related' which is reserved for relationships`,
    );
  }
}
