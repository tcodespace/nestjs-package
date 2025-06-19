import "reflect-metadata";

import type { NestModuleOptions } from "./type.decorator";

export function Module(params: NestModuleOptions) {
  return (target: Function) => {
    Reflect.defineMetadata("controllers", params.imports, target);
  };
}
