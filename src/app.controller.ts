import { Controller, Get } from "@nestjs/common";

@Controller("api")
export class AppController {
  @Get("hello")
  getHello(): string {
    return "<h1 style='color:red;'>Hello Nestjs!</h1>";
  }
}
