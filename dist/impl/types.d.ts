type Configuration = {
    mode: 'strict' | 'loose';
    ingres: {
        simple: {
            idKey: string;
            metadataKey: string;
            dataKey: string;
        };
    };
};
/**
 * A single item in the table
 *
 * The _k field is the default primary key unless otherwise overridden for the
 * table.
 */
interface DBItem {
    _k: string | number;
    [key: string]: any;
}
type TransformValues = 'date';
/**
 * Built in transformations.
 */
declare const Transforms: {
    DATE: string;
};
interface Transformation {
    /**
     * Where the data comes from for the transformation
     */
    sourceField: string;
    /**
     * What field the transformed data goes to.
     */
    targetField: string;
    /**
     * The transformation to apply to the data.
     */
    transform: TransformValues;
}
declare const RelationshipType: {
    OneToOne: RelationshipTypeValues;
    OneToMany: RelationshipTypeValues;
};
type RelationshipTypeValues = 0 | 1;
type RuntimeRelationshipDefinition = {
    _fieldName: string;
    targetType: string;
    propName: string;
    value: any;
    type: RelationshipTypeValues;
};
interface RuntimeTypeDefinition {
    name: string;
    transforms: Transformation[];
}
interface RuntimeTypeRegistry {
    [key: string]: RuntimeTypeDefinition;
}
type DataNodeTypes = 'dataInstance' | 'dataContainer' | 'object' | 'value';
interface InputDataInstance {
    _k: string | number;
    [key: string]: any;
}
interface InputDataContainer {
    data?: InputDataInstance[];
    metadata: InputDataContainerMetadata;
}
interface InputDataContainerMetadata {
    transforms: {
        sourceField: string;
        targetField: string;
        transform: TransformValues;
    }[];
}
interface InputObject {
    [key: string]: any;
}
type InputDatas = ({
    type: DataNodeTypes;
} & ({
    type: 'dataInstance';
    data: InputDataInstance;
} | {
    type: 'dataContainer';
    data: InputDataContainer;
} | {
    type: 'object';
    data: InputObject;
})) | {
    type: 'value';
    data: null;
};
export type { DataNodeTypes, InputDatas, InputObject, InputDataContainer, InputDataInstance, InputDataContainerMetadata, Transformation, };
export { Transforms, RelationshipType };
export type { Configuration, DBItem, RelationshipTypeValues, RuntimeTypeRegistry, RuntimeRelationshipDefinition, RuntimeTypeDefinition, };
