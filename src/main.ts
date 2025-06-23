import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

import session from "express-session";

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
  app.listen(3000);
}

bootstrap();
