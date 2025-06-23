import {
  Controller,
  Get,
  Request,
  Headers,
  IP,
  Query,
  Params,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";

@Controller("api")
export class AppController {
  @Get("hello/:username/:id")
  getHello(
    @Request() request: ExpressRequest,
    @Request("url") url: string,
    @Query() query: object,
    @Headers() headers: object,
    @IP() ip: string,
    @Params() params: object
  ): string {
    console.log("[ ip ] >", ip, params);
    return "<h1 style='color:red;'>Hello Nestjs!</h1>";
  }

  @Get(":username/info")
  getUserInfo(@Params("username") username: string) {
    return `hello ${username}!`;
  }

  @Get("/ab*de")
  getWords(@Request("url") url: string) {
    return url;
  }
}
