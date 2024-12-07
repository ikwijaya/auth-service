import { type HttpStatusCode } from 'axios';

export function isAPIError(obj: any): obj is IApiError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.statusCode === 'number' &&
    typeof obj.message === 'string' // Assuming the Error interface has a message property
  );
}
export interface IApiError extends Error {
  statusCode: number;
  rawErrors?: string[];
  relogin?: boolean;
  fields?: Record<string, any> | undefined;
}

export class ApiError extends Error implements IApiError {
  statusCode: number;
  rawErrors: string[];
  fields: Record<string, any> | undefined;
  constructor(
    statusCode: number,
    message: string,
    rawErrors?: string[],
    fields?: Record<string, any> | undefined
  ) {
    super(message);
    this.statusCode = statusCode;
    if (fields) this.fields = fields;
    if (rawErrors) {
      this.rawErrors = rawErrors;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 *
 * @param statusCode
 * @param message
 * @param stack
 * @returns
 */
export const setError = (
  statusCode: HttpStatusCode,
  message: string,
  relogin: boolean = false,
  stack?: string,
  fields?: Record<string, any> | undefined
) => {
  const error: IApiError = {
    statusCode,
    name: 'Error',
    message,
    stack,
    relogin,
    fields,
  };

  return error;
};
