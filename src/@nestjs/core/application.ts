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
  ArgumentsHost,
  defineModule,
  ExceptionFilter,
  GlobalExceptionFilter,
  HttpMethodMiddleware,
  NestMiddleware,
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
  private readonly middlewareBucket = new Set<
    new (...args: any[]) => NestMiddleware | Function
  >();
  private readonly excludeRoutesBucket: Array<{
    routePath: string;
    routeMethod: HttpMethodMiddleware;
  }> = [];
  private readonly _baseBath: string = "/";
  private readonly modulesBucket = new Map<Function, Set<Function | string>>();
  private readonly providersBucket = new Map<
    Function | string,
    new (...args: any[]) => any
  >();
  private readonly globalProviders = new Set<Function | string>();

  private readonly globalDefaultExceptionFilter = new GlobalExceptionFilter();

  private readonly globalExceptionFilters:
    | (new (...args: any[]) => ExceptionFilter<unknown>)[]
    | ExceptionFilter<unknown>[] = [];

  constructor(module: Function) {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.module = module;
  }

  public useGlobalFilters(...filters: []) {
    this.globalExceptionFilters.push(...filters);
    defineModule(
      this.module,
      filters.filter(
        (item: new (...args: any[]) => ExceptionFilter<unknown>) =>
          item instanceof Function
      )
    );
  }

  public use(middleware: RequestHandler | ErrorRequestHandler) {
    this.app.use(middleware);
  }

  private initMiddleware() {
    this.module.prototype.configure(this);
  }

  private apply(...middlewareList: (new (...args: []) => NestMiddleware)[]) {
    defineModule(this.module, middlewareList);
    for (const middleware of middlewareList) {
      this.middlewareBucket.add(middleware);
    }
    return this;
  }

  private forRoutes(
    ...routes:
      | Array<string>
      | Array<{ path: string; method: HttpMethodMiddleware }>
  ) {
    for (const route of routes) {
      const { routePath, routeMethod } = this.normalizeRoutes(route);
      for (const middleware of this.middlewareBucket) {
        this.app.use(routePath, (req, res, next) => {
          if (this.excludeRoutes(req.originalUrl, routeMethod)) {
            return next();
          }
          if (
            routeMethod === HttpMethodMiddleware.ALL ||
            routeMethod === req.method
          ) {
            if (Reflect.has(middleware, "use")) {
              const middlewareInstance = this.getMiddlewareInstance(
                middleware as new (...args: unknown[]) => NestMiddleware
              );
              middlewareInstance.use(req, res, next);
            } else if (middleware instanceof Function) {
              (middleware as Function)(req, res, next);
            } else {
              next();
            }
          } else {
            next();
          }
        });
      }
    }
  }

  private exclude(
    ...routes:
      | Array<string>
      | Array<{ path: string; method: HttpMethodMiddleware }>
  ) {
    for (const route of routes) {
      this.excludeRoutesBucket.push(this.normalizeRoutes(route));
    }
    return this;
  }

  private excludeRoutes(routePath: string, routeMethod: HttpMethodMiddleware) {
    return Array.from(this.excludeRoutesBucket).some(
      (item) => item.routePath === routePath && item.routeMethod === routeMethod
    );
  }

  private getMiddlewareInstance(
    middleware: (new (...args: unknown[]) => NestMiddleware) | NestMiddleware
  ): NestMiddleware {
    const dependencies: unknown[] =
      this.resolveDependencies(
        middleware as new (...args: []) => NestMiddleware
      ) ?? [];

    return middleware instanceof Function
      ? new middleware(...dependencies)
      : middleware;
  }

  private normalizeRoutes(
    routes: string | { path: string; method: HttpMethodMiddleware }
  ) {
    let routePath = "",
      routeMethod = HttpMethodMiddleware.ALL;

    if (typeof routes === "string") {
      routePath = routes;
    } else {
      routePath = routes.path;
      routeMethod = routes.method;
    }

    return {
      routePath: path.posix.join(this._baseBath, routePath),
      routeMethod,
    };
  }

  private async initProvider() {
    const imports = Reflect.getMetadata("imports", this.module) ?? [];
    for (const importModule of imports) {
      let dynamicModule = null;
      if (isPromise(importModule)) {
        dynamicModule = await importModule;
      }
      const moduleTrack = dynamicModule ?? importModule;
      if ("module" in moduleTrack) {
        const { module, providers, exports, controllers } = moduleTrack;
        const newProviders = [
          ...(Reflect.getMetadata("providers", module) ?? []),
          ...(providers ?? []),
        ];
        const newExports = [
          ...(Reflect.getMetadata("exports", module) ?? []),
          ...(exports ?? []),
        ];
        const newControllers = [
          ...(Reflect.getMetadata("controllers", module) ?? []),
          ...(controllers ?? []),
        ];
        defineModule(module, newProviders || []);
        defineModule(module, newControllers || []);
        Reflect.defineMetadata("providers", newProviders, module);
        Reflect.defineMetadata("exports", newExports, module);
        Reflect.defineMetadata("controllers", newControllers, module);
        this.resolveProviders(module, this.module);
      } else {
        this.resolveProviders(moduleTrack, this.module);
      }
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
    const injectParams = Reflect.getMetadata("injectToken", Class) ?? [];
    const dependenciesParams =
      Reflect.getMetadata(DESIGN_PARAMTYPES, Class) ?? [];

    const module = Reflect.getMetadata("nestModule", Class);

    return dependenciesParams.map(
      (item: new (...args: any[]) => any, index: number) =>
        this.getProvidersByToken(module, injectParams[index] ?? item) ?? item
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
      hasPassthrough = (responseMetaData.params as { passthrough: boolean })[
        ResponseDecoratorPassthrough
      ];
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
    next: NextFunction,
    argumentsHost: ArgumentsHost
  ) {
    // 处理参数装饰器
    const methodArguments = paramsMetaData.map((item) => {
      const params = String(item.params);
      // 自定义参数装饰器
      if (item.type instanceof Function) {
        return item.type(undefined, argumentsHost);
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
    console.log("[ me ] >", methodArguments);
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

      const classFilters =
        Reflect.getMetadata("classFilters", Controller) ?? [];

      defineModule(
        this.module,
        classFilters.filter(
          (item: new (...args: any[]) => ExceptionFilter<unknown>) =>
            item instanceof Function
        )
      );

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

        const methodFilters =
          Reflect.getMetadata("methodFilters", method) ?? [];

        defineModule(
          this.module,
          methodFilters.filter(
            (item: new (...args: any[]) => ExceptionFilter<unknown>) =>
              item instanceof Function
          )
        );

        this.app[methodType](
          finalRoute,
          (request: Request, response: Response, next: NextFunction) => {
            this.attachHeader(response, customHeader);

            const argumentsHost: ArgumentsHost = {
              switchToHttp: () => ({
                getRequest: () => request,
                getResponse: () => response,
                getNext: () => next,
              }),
            };

            try {
              const methodArguments = this.resolveParams(
                paramsMetaData,
                request,
                response,
                next,
                argumentsHost
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

              const hasResponseDecorator =
                this.inspectDecorator(paramsMetaData);
              if (hasResponseDecorator) return;

              !isPromise(result)
                ? response.send(result)
                : result.then((res: unknown) => {
                    response.send(res);
                  });
            } catch (error) {
              this.callExceptionFilter(
                error,
                argumentsHost,
                methodFilters,
                classFilters
              );
            }
          }
        );
      }
    }
  }

  private callExceptionFilter(
    error: any,
    argumentsHost: ArgumentsHost,
    methodFilters: ExceptionFilter<unknown>[],
    classFilters: ExceptionFilter<unknown>[]
  ) {
    const appExceptionFilters = [
      ...methodFilters,
      ...classFilters,
      ...this.globalExceptionFilters,
      this.globalDefaultExceptionFilter,
    ];
    for (const filter of appExceptionFilters) {
      const filterInstance = this.getFilterInstance(filter);
      const catchException =
        Reflect.getMetadata("catch", filter.constructor) ?? [];
      if (
        catchException.length === 0 ||
        catchException.some(
          (item: new (...args: any[]) => unknown) => error instanceof item
        )
      ) {
        filterInstance.catch(error, argumentsHost);
        break;
      }
    }
  }

  private getFilterInstance(
    filter:
      | ExceptionFilter<unknown>
      | (new (...args: any[]) => ExceptionFilter<unknown>)
  ) {
    if (filter instanceof Function) {
      const params = this.resolveDependencies(filter);
      return new filter(...params);
    }
    return filter;
  }

  async listen(port: number) {
    await this.initProvider();
    await this.initMiddleware();
    await this.resolver();
    this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}
