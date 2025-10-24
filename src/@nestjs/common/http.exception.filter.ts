import { HttpStatus } from "./enum";
import { HttpException } from "./http.exception";
import { ArgumentsHost, ExceptionFilter } from "./type";

export class GlobalExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException | unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();
      response
        .status(status)
        .json(
          typeof message === "string"
            ? { statusCode: status, message }
            : message
        );
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
      });
    }
  }
}
