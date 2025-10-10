import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { LoggerService } from "src/modules/logger.service";

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const loggerText = this.loggerService.getAll();
    if (loggerText.length) {
      res.status(500).send(`<h1 style='color: red;'>${loggerText}</h1>`);
      return;
    }
    next();
  }
}
