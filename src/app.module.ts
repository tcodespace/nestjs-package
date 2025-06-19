import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

@Module({
  imports: [AppController],
})
export class AppModule {}
