import "reflect-metadata";
import { isObject } from "rattail";

import type { NestControllerOptions } from "./type.decorator";

export function Controller(path?: string): ClassDecorator;
export function Controller(options?: NestControllerOptions): ClassDecorator;
export function Controller(params?: string | NestControllerOptions) {
  const controllerPrefix = (isObject(params) ? params.prefix : params) || "";
  return (target: Function) => {
    Reflect.defineMetadata("controllerPrefix", controllerPrefix, target);
  };
}
