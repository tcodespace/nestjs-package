import { Module } from "@nestjs/common";
import { LoggerController } from "./logger.controller";
import { LoggerService } from "./logger.service";

@Module({
  controllers: [LoggerController],
  providers: [LoggerService],
  imports: [],
  exports: [LoggerService],
})
export class LoggerModule {}
