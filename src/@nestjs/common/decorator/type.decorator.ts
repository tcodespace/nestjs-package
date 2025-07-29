import type { NextFunction } from "express";

export interface NestModuleOptions {
  imports?: Function[];
  controllers?: Function[];
  providers?: Function[];
  exports?: Function[];
}

export interface NestControllerOptions {
  prefix: string;
}

export enum HttpMethod {
  GET = "get",
  POST = "post",
}

export type HttpMethods = (typeof HttpMethod)[keyof typeof HttpMethod];

export interface ControllerInstance {
  [key: string]: () => unknown;
}

export type ParamsDecoratorType =
  | "Request"
  | "Query"
  | "Headers"
  | "IP"
  | "Params"
  | "Response"
  | "Body"
  | "Session"
  | "Next";

export interface ParamsDecoratorMeta {
  type: ParamsDecoratorType | Function;
  params?: string | object;
}

export interface RedirectInfo {
  url: string;
  status: number;
}

export interface ExecutionContext {
  switchToHttp: () => {
    getRequest: () => Request & Record<string, any>;
    getResponse: () => Response;
    getNext: () => NextFunction;
  };
}

export const ResponseDecoratorPassthrough = "passthrough";
