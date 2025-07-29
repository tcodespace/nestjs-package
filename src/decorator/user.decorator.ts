import { createParamsDecorator, ExecutionContext } from "@nestjs/common";

export const User = createParamsDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
