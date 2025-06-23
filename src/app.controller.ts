import { Controller, Get, Request, Headers, IP, Query } from "@nestjs/common";
import type { Request as ExpressRequest } from "express";

@Controller("api")
export class AppController {
  @Get("hello")
  getHello(
    @Request() request: ExpressRequest,
    @Request("url") url: string,
    @Query() query: object,
    @Headers() headers: object,
    @IP() ip: string
  ): string {
    console.log("[ ip ] >", ip);
    return "<h1 style='color:red;'>Hello Nestjs!</h1>";
  }
}
