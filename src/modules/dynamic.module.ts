import { DynamicModule, Module } from "@nestjs/common";

@Module({
  providers: [],
  exports: [],
})
export class DynamicConfigModule {
  static forRoot(): DynamicModule {
    const providers = [
      {
        provide: "Config",
        useValue: {
          port: 3000,
        },
      },
    ];
    return {
      controllers: [],
      providers,
      exports: providers.map((provider) =>
        provider instanceof Function ? provider : provider.provide
      ),
      module: DynamicConfigModule,
    };
  }
}
