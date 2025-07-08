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
  ResponseDecoratorPassthrough,
  type ControllerInstance,
  type HttpMethods,
  type ParamsDecoratorMeta,
} from "../common";
import { isPromise } from "rattail";

export class NestApplication {
  private readonly app: Express;
  private readonly module: Function;
  private readonly _baseBath: string = "/";

  constructor(module: Function) {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.module = module;
  }

  public use(middleware: RequestHandler | ErrorRequestHandler) {
    this.app.use(middleware);
  }

  /**
   * @description 检查方法是否有Response装饰器
   * @param paramsMetaData 方法的参数装饰器数组
   * @returns boolean
   */
  private InspectResponseDecorator(paramsMetaData: ParamsDecoratorMeta[]) {
    let hasPassthrough = false;
    const responseMetaData = paramsMetaData.find(
      (item) => item.type === "Response"
    );
    if (responseMetaData?.params) {
      hasPassthrough = Reflect.has(
        responseMetaData?.params as object,
        ResponseDecoratorPassthrough
      );
    }
    return responseMetaData && !hasPassthrough;
  }

  private attachHeader(response: Response, header: Record<string, string>) {
    for (const propertyKey in header) {
      response.setHeader(propertyKey, header[propertyKey]);
    }
  }

  private resolveParams(
    paramsMetaData: ParamsDecoratorMeta[] = [],
    request: Request,
    response: Response
  ) {
    // 处理参数装饰器
    const methodArguments = paramsMetaData.map((item) => {
      const params = String(item.params);
      switch (item.type) {
        case "Request":
          return item.params ? (request as any)[params] : request;
        case "Query":
          return item.params ? request.query?.[params] : request.query;
        case "Headers":
          return item.params ? request.headers?.[params] : request.headers;
        case "IP":
          return request.ip;
        case "Params":
          return item.params ? request.params?.[params] : request.params;
        case "Body":
          return item.params ? request.body?.[params] : request.body;
        case "Response":
          return response;
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
              response
            );

            const result = method?.call(instance, ...methodArguments);

            const hasResponseDecorator =
              this.InspectResponseDecorator(paramsMetaData);
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
