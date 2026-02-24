import { SetMetadata } from '@nestjs/common';
import { RESPONSE_MESSAGE_KEY } from '../interceptors/response-transform.interceptor';

/**
 * Set a custom success message for the standard API response.
 * Use on controller methods: @ApiMessage('User created successfully')
 */
export const ApiMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
