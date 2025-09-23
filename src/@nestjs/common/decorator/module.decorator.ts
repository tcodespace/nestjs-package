import "reflect-metadata";

import type { NestModuleOptions } from "./type.decorator";

export function Module(params: NestModuleOptions) {
  return (target: Function) => {
    Reflect.defineMetadata("is-module", true, target);

    defineModule(target, params.controllers || []);
    Reflect.defineMetadata("controllers", params.controllers, target);

    const providers =
      params.providers
        ?.map((provider) => {
          if (typeof provider === "function") {
            return provider;
          } else if (typeof provider?.useClass === "function") {
            return provider.useClass;
          }
          return null;
        })
        .filter(Boolean) || [];
    defineModule(target, providers);
    Reflect.defineMetadata("providers", providers, target);

    Reflect.defineMetadata("imports", params.imports, target);

    Reflect.defineMetadata("exports", params.exports, target);
  };
}

export function defineModule(target: Function, modules: Function[]) {
  modules.forEach((module) => {
    Reflect.defineMetadata("nestModule", target, module);
  });
}

export function Global() {
  return (target: Function) => {
    Reflect.defineMetadata("global", true, target);
  };
}
