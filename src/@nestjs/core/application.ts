import "reflect-metadata";
import path from "path";
import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import type { ControllerInstance, HttpMethods } from "../common";

export class NestApplication {
  private readonly app: Express;
  private readonly module: Function;
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
        const finalRoute = path.posix.join(prefix, methodPath);
        this.app[methodType](
          "/" + finalRoute,
          (request: Request, response: Response, next: NextFunction) => {
            const result = method?.();
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
