import "reflect-metadata";

export function Catch(
  ...exceptions: (new (...args: any[]) => any)[]
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata("catch", exceptions, target);
  };
}
