import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
        // this.logger.error({exception});
    let responseBody: any = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      method: ctx.getRequest().method,
      error: exception instanceof Error ? exception.message : exception,
    };
    this.logger.error(responseBody);
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "object" && response.hasOwnProperty("message")) {
        responseBody = {
          ...responseBody,
          validationErrors: response["message"],
        };
      }
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
