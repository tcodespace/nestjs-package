import { Controller, Get, Request, Headers } from "@nestjs/common";

@Controller("api")
export class AppController {
  @Get("hello")
  getHello(
    @Request() request: object,
    @Request("url") url: string,
    @Headers() headers: object
  ): string {
    console.log("[ request, url, headers ] >", request, url, headers);
    return "<h1 style='color:red;'>Hello Nestjs!</h1>";
  }
}
