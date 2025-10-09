import {
  HttpMethodMiddleware,
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserService } from "./services/user.service";
import { FactoryService } from "./services/factory.service";
import { LoggerModule } from "./modules/logger.module";
import { DynamicConfigModule } from "./modules/dynamic.module";
import { UserMiddleware } from "./middleware/user.middleware";

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: AppService,
      useClass: AppService,
    },
    {
      provide: "USER_SERVICE",
      useValue: new UserService("prefix"),
    },
    {
      provide: "FactoryToken",
      inject: ["prefix1", "prefix2", "USER_SERVICE"],
      useFactory: (
        prefix1: string,
        prefix2: string,
        USER_SERVICE: UserService
      ) => new FactoryService(prefix1, prefix2, USER_SERVICE),
    },
  ],
  // @ts-ignore
  imports: [LoggerModule, DynamicConfigModule.forRoot()],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(UserMiddleware).forRoutes({
      path: "/api/user",
      method: HttpMethodMiddleware.GET,
    });
  }
}
