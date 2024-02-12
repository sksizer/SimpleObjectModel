import { Configuration, DataNodeTypes, InputDatas } from '../../types';
import { ContextImpl } from '../../contextImpl';
declare function getNodeType(data: any, configuration?: Configuration): DataNodeTypes;
declare function hasValidDataField(tableData: {
    [key: string]: any;
}): {
    valid: boolean;
    error: string;
};
declare function getNodeData(data: any): InputDatas;
/**
 * Fills in an ORM Context with data from an object
 * @param orm : Context
 * @param data : any
 */
declare function loadORMFromData(orm: ContextImpl, data: any): void;
export { getNodeData, getNodeType, hasValidDataField, loadORMFromData };
