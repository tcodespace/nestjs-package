import { Controller, Get, Request, Headers } from "@nestjs/common";
import type { Request as ExpressRequest } from "express";

@Controller("api")
export class AppController {
  @Get("hello")
  getHello(
    @Request() request: ExpressRequest,
    @Request("url") url: string,
    @Headers() headers: object
  ): string {
    return "<h1 style='color:red;'>Hello Nestjs!</h1>";
  }
}
