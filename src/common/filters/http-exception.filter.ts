import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { errorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, data } = this.getExceptionDetails(exception);

    this.logger.warn(
      `${request.method} ${request.url} ${statusCode} - ${message}`,
    );

    response.status(statusCode).json(errorResponse(message, statusCode, data));
  }

  private getExceptionDetails(exception: unknown): {
    statusCode: number;
    message: string;
    data: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        const message =
          (res.message as string) ||
          (Array.isArray(res.message) ? res.message[0] : exception.message) ||
          'An error occurred';
        const data = res.error ?? res.errors ?? null;
        return { statusCode, message: String(message), data };
      }

      return {
        statusCode,
        message: exception.message || 'An error occurred',
        data: null,
      };
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      data: null,
    };
  }
}
