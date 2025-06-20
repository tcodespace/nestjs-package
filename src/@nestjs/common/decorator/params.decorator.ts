import "reflect-metadata";
import { ParamsDecoratorMeta, ParamsDecoratorType } from "./type.decorator";

export function createParamsDecorator(
  paramsDecoratorType: ParamsDecoratorType
) {
  return function (factoryParams?: string) {
    return (target: object, propertyKey: string, paramsIndex: number) => {
      const paramsMetaData: ParamsDecoratorMeta[] =
        Reflect.getMetadata("params", target, propertyKey) || [];
      paramsMetaData[paramsIndex] = {
        type: paramsDecoratorType,
        params: factoryParams,
      };
      Reflect.defineMetadata("params", paramsMetaData, target, propertyKey);
    };
  };
}

export const Request = createParamsDecorator("Request");

export const Req = Request;
