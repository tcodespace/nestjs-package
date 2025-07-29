import "reflect-metadata";

export function Injectable() {
  return (target: Function) => {
    Reflect.defineMetadata("injectable", true, target);
  };
}
