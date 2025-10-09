import { MiddlewareConsumer } from "./type";

export interface NestModule {
  configure(consumer: MiddlewareConsumer): void;
}
