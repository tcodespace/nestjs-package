import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

import session from "express-session";

import type { Request, Response } from "express";
import { TimestampExceptionFilter } from "./filters/timestamp.exception.filter";

function bootstrap() {
  const app = NestFactory.create(AppModule);
  app.use(
    session({
      secret: "safe_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 4,
      },
    })
  );
  app.use(
    (
      request: Request & Record<string, any>,
      _response: Response,
      next: Function
    ) => {
      request.user = {
        name: "张三",
      };
      next();
    }
  );

  app.listen(3000);
}

bootstrap();
