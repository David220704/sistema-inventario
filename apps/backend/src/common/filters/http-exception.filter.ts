import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

/**
 * HttpExceptionFilter
 * Global exception filter that catches all HttpException instances and returns
 * a consistent JSON response body with statusCode and message fields.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Handles the caught exception by sending a structured JSON error response.
   * @param exception - The HttpException that was thrown
   * @param host - Provides access to the request/response context
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    response.status(status).json({ statusCode: status, message: (exception as any).message });
  }
}
