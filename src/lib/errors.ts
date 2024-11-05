import { HttpStatusCode } from 'axios';

export function isAPIError(obj: any): obj is IApiError { return true }
export interface IApiError extends Error {
  statusCode: number;
  rawErrors?: string[];
  relogin?: boolean;
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

export class HttpBadRequestError extends ApiError {
  constructor(
    message: string,
    errors: string[],
    fields?: Record<string, any> | undefined
  ) {
    super(HttpStatusCode.BadRequest, message, errors, fields);
  }
}

export class HttpInternalServerError extends ApiError {
  constructor(
    message: string,
    errors?: string[],
    fields?: Record<string, any> | undefined
  ) {
    super(HttpStatusCode.InternalServerError, message, errors, fields);
  }
}

export class HttpUnAuthorizedError extends ApiError {
  constructor(message: string) {
    super(HttpStatusCode.Unauthorized, message);
  }
}

export class HttpNotFoundError extends ApiError {
  constructor(message: string, errors?: string[]) {
    super(HttpStatusCode.NotFound, message, errors);
  }
}
