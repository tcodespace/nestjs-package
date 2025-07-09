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

export function Post(path: string) {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, descriptor.value);
    Reflect.defineMetadata("method", HttpMethod.POST, descriptor.value);
  };
}

export function Head(headerParams: Record<string, string>) {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("header", headerParams, descriptor.value);
  };
}

export function Redirect(url: string, status: number) {
  return (
    target: object,
    propertyKey: string,
    decorator: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("redirect", { url, status }, decorator.value);
  };
}
