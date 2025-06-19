import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

function bootstrap() {
  const app = NestFactory.create(AppModule);
  app.listen(3000);
}

bootstrap();
