import { ExceptionFilter } from "../type";

export function UseFilters(
  ...filters:
    | ExceptionFilter<unknown>[]
    | (new (...args: any[]) => ExceptionFilter<unknown>)[]
) {
  return (
    target: object | Function,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    if (descriptor)
      return Reflect.defineMetadata("methodFilters", filters, descriptor.value);
    else return Reflect.defineMetadata("classFilters", filters, target);
  };
}
