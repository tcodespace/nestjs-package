import { NextFunction, Request, Response } from "express";
import { HttpMethodMiddleware } from "./enum";
import { NestMiddleware } from "./middleware.interface";

export type RouteMiddlewareWithMethod = {
  path: string;
  method: HttpMethodMiddleware;
};

export interface MiddlewareConsumer {
  apply(...middlewares: (new (...args: any[]) => NestMiddleware)[]): this;
  forRoutes(...routes: Array<string> | Array<RouteMiddlewareWithMethod>): this;
  exclude(...routes: Array<string> | Array<RouteMiddlewareWithMethod>): this;
}

export interface ArgumentsHost {
  switchToHttp: () => {
    getRequest: () => Request;
    getResponse: () => Response;
    getNext: () => NextFunction;
  };
}

export interface ExceptionFilter<T> {
  catch(exception: T, host: ArgumentsHost): void;
}
