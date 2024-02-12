import { Configuration, DataNodeTypes, DBItem, InputDatas } from '../../types';
import { getConfiguration } from '../../config';
import { hydrateRelationships } from './linking';
import { ContextImpl } from '../../contextImpl';
import { getInputTransforms, transformData } from '../../transformation';

function getNodeType(
  data: any,
  configuration: Configuration = getConfiguration(),
): DataNodeTypes {
  if (
    configuration.mode === 'strict' &&
    (data === null || data === undefined)
  ) {
    throw new Error('getNodeType: data is null or undefined');
  }

  if (data === null || data === undefined) {
    return 'value';
  }
  try {
    if (configuration.ingres.simple.idKey in data) {
      return 'dataInstance';
    }
    if (
      configuration.ingres.simple.metadataKey in data ||
      configuration.ingres.simple.dataKey in data
    ) {
      return 'dataContainer';
    }
    return 'object';
  } catch (e) {
    return 'value';
  }
}

function hasValidDataField(tableData: { [key: string]: any }): {
  valid: boolean;
  error: string;
} {
  let valid = false;
  let error: string = '';
  if (!tableData.hasOwnProperty('data')) {
    error = 'data field is missing';
  } else {
    if (!Array.isArray(tableData.data)) {
      error = 'data field is not an array';
    } else {
      valid = true;
    }
  }
  return { valid, error };
}

function getNodeData(data: any): InputDatas {
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
function loadORMFromData(orm: ContextImpl, data: any) {
  _loadORMFromData(orm, getNodeData(data));
}
function _loadORMFromData(
  orm: ContextImpl,
  data: InputDatas,
  type: string = 'unknown',
) {
  let dT = data;

  if (dT.type === 'value') {
    return;
  }

  if (dT.type === 'dataInstance') {
    orm.getTypeStore(type).add(data as unknown as DBItem);
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
      dT.data.data.forEach((item: DBItem) => {
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

export { getNodeData, getNodeType, hasValidDataField, loadORMFromData };
