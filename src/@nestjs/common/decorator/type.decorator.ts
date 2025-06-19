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
