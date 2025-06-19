import { NestApplication } from "./application";

export class NestFactory {
  static create(module: Function) {
    return new NestApplication(module);
  }
}
