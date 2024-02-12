import { Configuration, RuntimeRelationshipDefinition } from '../../types';
import { ContextImpl } from '../../contextImpl';
/**
 * @param object
 */
export declare function getInstanceRelationshipDefinitions(object: {
    [key: string]: any;
}, configuration?: Configuration): RuntimeRelationshipDefinition[];
export declare function hydrateRelationships(db: ContextImpl): void;
export declare class LinkingError extends Error {
    protected constructor(message: string);
    static relatedFieldError(tableName: string, key: string | number): LinkingError;
}
