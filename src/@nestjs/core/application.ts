import "reflect-metadata";
import path from "path";
import express from "express";
import type {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import {
  RedirectInfo,
  ResponseDecoratorPassthrough,
  type ControllerInstance,
  type HttpMethods,
  type ParamsDecoratorMeta,
} from "../common";
import { isPromise } from "rattail";
import { DESIGN_PARAMTYPES } from "@nestjs/const";
import { ProviderObject, ProviderType } from "./core.type";

export class NestApplication {
  private readonly app: Express;
  private readonly module: Function;
  private readonly _baseBath: string = "/";
  private readonly modulesBucket = new Map<Function, Set<Function | string>>();
  private readonly providersBucket = new Map<
    Function | string,
    new (...args: any[]) => any
  >();
  private readonly globalProviders = new Set<Function | string>();

  constructor(module: Function) {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.module = module;
    this.initProvider();
  }

  public use(middleware: RequestHandler | ErrorRequestHandler) {
    this.app.use(middleware);
  }

  private initProvider() {
    const imports = Reflect.getMetadata("imports", this.module) ?? [];
    for (const importModule of imports) {
      this.resolveProviders(importModule, this.module);
    }

    const rootProviders = Reflect.getMetadata("providers", this.module) ?? [];
    for (const provider of rootProviders) {
      this.addProvider(provider, this.module);
    }
  }

  private resolveProviders(module: Function, ...parentModules: Function[]) {
    const global = Reflect.getMetadata("global", module);
    const importsProviders = Reflect.getMetadata("providers", module) ?? [];
    const exportServices = Reflect.getMetadata("exports", module) ?? [];

    for (const service of exportServices) {
      if (this.isModule(service)) {
        this.resolveProviders(service, module, ...parentModules);
      } else {
        const provider = importsProviders.find(
          (item: ProviderObject) => item.provide === service || item === service
        );
        if (provider) {
          [module, ...parentModules].forEach((item) => {
            this.addProvider(provider, item, global);
          });
        }
      }
    }
  }

  private isModule(module: Function) {
    return (
      module &&
      typeof module === "function" &&
      Reflect.getMetadata("is-module", module)
    );
  }

  private addProvider(
    provider: ProviderType | ProviderObject,
    module: Function,
    global: boolean = false
  ) {
    const providers = global
      ? this.globalProviders
      : this.modulesBucket.get(module) || new Set();

    if (!this.modulesBucket.has(module)) {
      this.modulesBucket.set(module, providers);
    }

    const injectToken =
      provider instanceof Function ? provider : provider.provide;

    if (this.providersBucket.has(injectToken!)) {
      providers.add(injectToken!);
      return;
    }

    if (typeof provider === "function") {
      const dependencies = this.resolveDependencies(provider);
      this.providersBucket.set(
        provider,
        new (provider as new (...args: any[]) => any)(...dependencies)
      );
      providers.add(provider);
      return;
    }

    if (provider.provide && provider.useClass) {
      const dependencies = this.resolveDependencies(provider.useClass);
      const obj = new provider.useClass(...dependencies);
      this.providersBucket.set(provider.provide, obj);
      providers.add(provider.provide);
    } else if (provider.provide && provider.useValue) {
      this.providersBucket.set(provider.provide, provider.useValue);
      providers.add(provider.provide);
    } else if (provider.provide && provider.useFactory) {
      const args = provider.inject ?? [];
      this.providersBucket.set(
        provider.provide,
        provider.useFactory(
          ...args.map(
            (item: any) => this.getProvidersByToken(module, item) ?? item
          )
        )
      );
      providers.add(provider.provide);
    }
  }

  private getProvidersByToken(module: Function, token: string) {
    if (
      this.modulesBucket.get(module)?.has(token) ||
      this.globalProviders.has(token)
    ) {
      return this.providersBucket.get(token);
    }
    return null;
  }

  private resolveDependencies(Class: Function) {
    const injectParams = Reflect.getMetadata("injectToken", Class);
    const dependenciesParams =
      Reflect.getMetadata(DESIGN_PARAMTYPES, Class) ?? [];

    const module = Reflect.getMetadata("nestModule", Class);

    return dependenciesParams.map(
      (item: new (...args: any[]) => any, index: number) =>
        this.getProvidersByToken(module, injectParams[index]) ?? item
    );
  }

  private redirectRoute(response: Response, redirect: RedirectInfo) {
    const { url, status = 302 } = redirect;
    response.redirect(status, url);
  }

  /**
   * @description 检查方法是否有Response装饰器
   * @param paramsMetaData 方法的参数装饰器数组
   * @returns boolean
   */
  private inspectDecorator(paramsMetaData: ParamsDecoratorMeta[]) {
    let hasPassthrough = false;
    const responseMetaData = paramsMetaData?.find(
      (item) => item.type === "Response"
    );
    const nextMeteData = paramsMetaData?.find((item) => item.type === "Next");

    if (responseMetaData?.params) {
      hasPassthrough = Reflect.has(
        responseMetaData?.params as object,
        ResponseDecoratorPassthrough
      );
    }
    return (responseMetaData && !hasPassthrough) || nextMeteData;
  }

  private attachHeader(response: Response, header: Record<string, string>) {
    for (const propertyKey in header) {
      response.setHeader(propertyKey, header[propertyKey]);
    }
  }

  private resolveParams(
    paramsMetaData: ParamsDecoratorMeta[] = [],
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    // 处理参数装饰器
    const methodArguments = paramsMetaData.map((item) => {
      const params = String(item.params);
      // 自定义参数装饰器
      if (item.type instanceof Function) {
        const context = {
          switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
            getNext: () => next,
          }),
        };
        return item.type(undefined, context);
      }
      switch (item.type) {
        case "Request":
          return params ? (request as any)[params] : request;
        case "Query":
          return params ? request.query?.[params] : request.query;
        case "Headers":
          return params ? request.headers?.[params] : request.headers;
        case "IP":
          return request.ip;
        case "Params":
          return params ? request.params?.[params] : request.params;
        case "Body":
          return params ? request.body?.[params] : request.body;
        case "Response":
          return response;
        case "Session":
          return request.session;
        case "Next":
          return next;
        default:
          return undefined;
      }
    });
    return methodArguments;
  }

  private resolver() {
    const controllers: (new (...args: any[]) => {})[] = Reflect.getMetadata(
      "controllers",
      this.module
    );

    for (const Controller of controllers) {
      const dependencies = this.resolveDependencies(Controller);

      const instance: ControllerInstance = new Controller(...dependencies);

      const prefix = Reflect.getMetadata("controllerPrefix", Controller);

      const prototypeMethods = Object.getOwnPropertyNames(
        Controller.prototype
      ).filter((item) => item !== "constructor");

      for (const methodName of prototypeMethods) {
        const method = Controller.prototype[methodName];
        if (!method) continue;
        const methodPath = Reflect.getMetadata("path", method);
        const methodType: HttpMethods = Reflect.getMetadata("method", method);
        const redirect = Reflect.getMetadata("redirect", method);
        const customHeader: Record<string, string> = Reflect.getMetadata(
          "header",
          method
        );

        const finalRoute = path.posix.join(this._baseBath, prefix, methodPath);

        // 收集方法的参数装饰器数组
        const paramsMetaData: ParamsDecoratorMeta[] = Reflect.getMetadata(
          "params",
          Controller.prototype,
          methodName
        );

        this.app[methodType](
          finalRoute,
          (request: Request, response: Response, next: NextFunction) => {
            this.attachHeader(response, customHeader);

            const methodArguments = this.resolveParams(
              paramsMetaData,
              request,
              response,
              next
            );

            const result = method?.call(instance, ...methodArguments);

            const hasRedirect = redirect && Object.keys(redirect)?.length;
            const hasUrlResult =
              result instanceof Object && Reflect.has(result, "url");

            if (hasRedirect || hasUrlResult) {
              return this.redirectRoute(
                response,
                hasRedirect ? redirect : result
              );
            }

            const hasResponseDecorator = this.inspectDecorator(paramsMetaData);
            if (hasResponseDecorator) return;

            !isPromise(result)
              ? response.send(result)
              : result.then((res: unknown) => {
                  response.send(res);
                });
          }
        );
      }
    }
  }

  async listen(port: number) {
    await this.resolver();

    this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}
