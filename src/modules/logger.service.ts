import { Injectable } from "@nestjs/common";

@Injectable()
export class LoggerService {
  getAll() {
    return "logger list";
  }
}
