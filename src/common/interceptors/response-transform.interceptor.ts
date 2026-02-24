import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { ApiResponse, successResponse } from '../interfaces/api-response.interface';

/**
 * Symbol/key for setting a custom success message per route (e.g. via decorator).
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const customMessage = this.reflector.get<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        const statusCode = response.statusCode || 200;
        const message = customMessage ?? 'Success';
        return successResponse(data, message, statusCode) as ApiResponse<T>;
      }),
    );
  }
}
