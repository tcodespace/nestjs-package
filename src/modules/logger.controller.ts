import { Controller, Get } from "@nestjs/common";
import { LoggerService } from "./logger.service";

@Controller("logger")
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get("list")
  getLoggerList() {
    console.log("[ this.loggerService ] >", this.loggerService.getAll());
    return this.loggerService.getAll();
  }
}
