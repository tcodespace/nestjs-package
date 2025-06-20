import "reflect-metadata";
import path from "path";
import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import type {
  ControllerInstance,
  HttpMethods,
  ParamsDecoratorMeta,
} from "../common";

export class NestApplication {
  private readonly app: Express;
  private readonly module: Function;
  private readonly _baseBath: string = "/";

  constructor(module: Function) {
    this.app = express();
    this.module = module;
  }

  resolver() {
    const controllers: (new (...args: any[]) => {})[] = Reflect.getMetadata(
      "controllers",
      this.module
    );

    for (const Controller of controllers) {
      const instance: ControllerInstance = new Controller();

      const prefix = Reflect.getMetadata("controllerPrefix", Controller);

      const prototypeMethods = Object.getOwnPropertyNames(
        Controller.prototype
      ).filter((item) => item !== "constructor");

      for (const methodName of prototypeMethods) {
        const method = Controller.prototype[methodName];
        if (!method) continue;
        const methodPath = Reflect.getMetadata("path", method);
        const methodType: HttpMethods = Reflect.getMetadata("method", method);
        const finalRoute = path.posix.join(this._baseBath, prefix, methodPath);

        // 收集参数装饰器数组
        const paramsMetaData: ParamsDecoratorMeta[] = Reflect.getMetadata(
          "params",
          Controller.prototype,
          methodName
        );

        this.app[methodType](
          finalRoute,
          (request: Request, response: Response, next: NextFunction) => {
            // 处理参数装饰器
            const methodArguments = paramsMetaData?.map((item) => {
              let argumentsValue = null;
              switch (item.type) {
                case "Request":
                  return item.params ? (request as any)[item.params] : request;
                default:
                  return undefined;
              }
            });

            const result = method?.call(instance, ...methodArguments);
            response.send(result);
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
