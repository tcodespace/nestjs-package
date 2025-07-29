import {
  Controller,
  Get,
  Request,
  Headers,
  IP,
  Query,
  Params,
  Response,
  Post,
  Body,
  Head,
  Next,
  Redirect,
  Inject,
} from "@nestjs/common";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { User } from "./decorator/user.decorator";
import { AppService } from "./app.service";
import { UserService } from "./user.service";
import { FactoryService } from "./factory.module";

/**
 * 以下装饰器测试
 */
@Controller("api")
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject("USER_SERVICE") private readonly userService: UserService,
    @Inject("FactoryToken") private readonly factoryService: FactoryService
  ) {}

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

  @Get("/get/response")
  getResponse(@Response({ passthrough: true }) response: ExpressResponse) {
    console.log("[ response ] >", response);
    return "111";
  }

  @Post("/get/userinfo")
  @Head({
    Authentication: "Basic dXNlcm5hbWU6cGFzc3dvcmQ=999999",
  })
  getUser(@Body() body: object, @Body("username") username: string) {
    console.log("[ body ] >", body);
    return username;
  }

  @Get("next")
  getNext(@Next() next: Function) {
    next();
    return "next";
  }

  @Get("redirect/baidu")
  @Redirect("https://wwww.baidu.com", 302)
  getBaiduWebsite() {
    return "redirect to baidu website";
  }

  @Get("url/baidu")
  getBaidu() {
    return {
      url: "https://www.zhihu.com",
      status: 302,
    };
  }

  @Get("/user")
  getUserDecorator(user: object) {
    return user;
  }

  @Get("/list")
  getList() {
    console.log(
      "DI -> ",
      this.appService,
      this.userService,
      this.factoryService
    );
    return this.appService.getAllList();
  }
}
