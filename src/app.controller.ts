import { Controller, Get, Request } from "@nestjs/common";

@Controller("api")
export class AppController {
  @Get("hello")
  getHello(@Request() request: object, @Request("url") url: string): string {
    return "<h1 style='color:red;'>Hello Nestjs!</h1>";
  }
}
