import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserService } from "./user.service";
import { FactoryService } from "./factory.module";

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
})
export class AppModule {}
