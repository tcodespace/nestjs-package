import "reflect-metadata";
import { HttpMethod } from "./type.decorator";

export function Get(path: string = "") {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, descriptor.value);
    Reflect.defineMetadata("method", HttpMethod.GET, descriptor.value);
  };
}
