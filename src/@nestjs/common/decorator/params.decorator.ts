import "reflect-metadata";
import { ParamsDecoratorMeta, ParamsDecoratorType } from "./type.decorator";

type FactoryParamsTypeMap = {
  Request: string;
  Query: string;
  Headers: string;
  IP: string;
  Params: string;
  Body: string;
  Session: string;
  Next: string;
  Response: {
    passthrough?: boolean;
  };
};

export function createParamsDecorator<T extends ParamsDecoratorType | Function>(
  paramsDecoratorType: T
) {
  return function (
    factoryParams?: T extends ParamsDecoratorType
      ? FactoryParamsTypeMap[T]
      : never
  ) {
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

export const Headers = createParamsDecorator("Headers");

export const IP = createParamsDecorator("IP");

export const Query = createParamsDecorator("Query");

export const Params = createParamsDecorator("Params");

export const Response = createParamsDecorator("Response");

export const Res = Response;

export const Body = createParamsDecorator("Body");

export const Session = createParamsDecorator("Session");

export const Next = createParamsDecorator("Next");
