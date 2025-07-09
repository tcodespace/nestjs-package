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
  type: ParamsDecoratorType;
  params?: string | object;
}

export interface RedirectInfo {
  url: string;
  status: number;
}

export const ResponseDecoratorPassthrough = "passthrough";
