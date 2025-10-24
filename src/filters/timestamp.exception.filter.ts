import { ArgumentsHost, Catch, ExceptionFilter, Inject } from "@nestjs/common";
import { ForbiddenException } from "../exception/forbidden.exception";
import { isObject } from "rattail";

@Catch(ForbiddenException)
export class TimestampExceptionFilter
  implements ExceptionFilter<ForbiddenException>
{
  constructor(@Inject("prefix") private readonly prefix: string) {}

  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const path = ctx.getRequest().originalUrl;
    const timestamp = new Date().toISOString();
    const statusCode = exception.getStatus();
    const message = exception.getResponse();
    const finalMessage = isObject(message)
      ? { ...message, timestamp, path }
      : { message, timestamp, statusCode, path };
    response.status(exception.getStatus()).json(finalMessage);
  }
}
