import "reflect-metadata";

export function Inject(token: string): ParameterDecorator {
  // 构造函数的参数 target是构造函数 类本身
  return (target: Object, propertyKey: any, paramsIndex: number) => {
    const injectTokens = Reflect.getMetadata("injectToken", target) ?? [];
    injectTokens[paramsIndex] = token;
    Reflect.defineMetadata("injectToken", injectTokens, target);
  };
}
