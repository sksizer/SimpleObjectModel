import { InputDataContainer, Transformation } from './types';
import { ContextImpl } from './contextImpl';
declare class TransformationError extends Error {
    protected constructor(message: string);
    static transformNotRegisteredError(tableName: string, transform: Transformation): TransformationError;
    static invalidInputTransformError(data: InputDataContainer): TransformationError;
}
declare function getInputTransforms(data: InputDataContainer): Transformation[];
declare function transformData(db: ContextImpl): void;
export { transformData, getInputTransforms, TransformationError };
