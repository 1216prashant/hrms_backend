/**
 * Standard API response structure used across all endpoints.
 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T | null;
}

/**
 * Helper to build a success response (used internally by interceptor; can also be used in controllers).
 */
export function successResponse<T>(data: T, message = 'Success', statusCode = 200): ApiResponse<T> {
  return {
    statusCode,
    status: 'success',
    message,
    data,
  };
}

/**
 * Helper to build an error response (used by exception filter; can also be used in controllers).
 */
export function errorResponse(
  message: string,
  statusCode = 500,
  data: unknown = null,
): ApiResponse<unknown> {
  return {
    statusCode,
    status: 'error',
    message,
    data: data as unknown as unknown,
    };
}
