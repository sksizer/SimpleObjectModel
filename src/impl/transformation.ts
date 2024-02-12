import { InputDataContainer, Transformation, Transforms } from './types';
import { ContextImpl } from './contextImpl';
import { TypeStoreImpl } from './typeStoreImpl';

class TransformationError extends Error {
  protected constructor(message: string) {
    super(message);
  }

  static transformNotRegisteredError(
    tableName: string,
    transform: Transformation,
  ) {
    return new TransformationError(
      `Transform ${transform.transform} for field ${transform.sourceField} not registered for table ${tableName}`,
    );
  }

  static invalidInputTransformError(data: InputDataContainer) {
    return new TransformationError(`Invalid input transform for data ${data}`);
  }
}

function getInputTransforms(data: InputDataContainer): Transformation[] {
  let transforms: Transformation[] = [];
  if (data?.metadata?.transforms && Array.isArray(data?.metadata?.transforms)) {
    data.metadata.transforms.forEach((transform) => {
      if (
        transform.transform &&
        transform.sourceField &&
        transform.targetField
      ) {
        transforms.push(transform);
      } else {
        throw TransformationError.invalidInputTransformError(data);
      }
    });
  }
  return transforms;
}

function transformData(db: ContextImpl) {
  db.getTypes().forEach((tableName: string) => {
    let table = db.getTypeStore(tableName) as TypeStoreImpl<any>;
    let data = table.query();
    table.typeDefinition.transforms.forEach((transform) => {
      data.forEach((item) => {
        if (item.hasOwnProperty(transform.sourceField)) {
          switch (transform.transform) {
            case Transforms.DATE:
              item[transform.targetField] = new Date(
                item[transform.sourceField],
              );
              break;
            default:
              throw TransformationError.transformNotRegisteredError(
                tableName,
                transform,
              );
          }
        }
      });
    });
  });
}

export { transformData, getInputTransforms, TransformationError };
