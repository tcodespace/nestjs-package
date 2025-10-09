import { HttpMethodMiddleware } from "./enum";
import { NestMiddleware } from "./middleware.interface";

export interface MiddlewareConsumer {
  apply(...middlewares: (new (...args: any[]) => NestMiddleware)[]): this;
  forRoutes(
    ...routes: string[] | Array<{ path: string; method: HttpMethodMiddleware }>
  ): this;
}
