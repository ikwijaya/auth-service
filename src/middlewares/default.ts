import { type NextFunction, type Request, type Response } from 'express';
import { HttpStatusCode } from 'axios';
import dayjs from 'dayjs';
import { AUTH_BAD_00, AUTH_BAD_01 } from '@/utils/constants';
import { setError } from '@/lib/errors';

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const verifyTimestamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { headers } = req;
  const timestamp = headers.timestamp;
  const format = 'YYYY-MM-DDTHH:mm:ssZ';

  if (!timestamp)
    res
      .status(HttpStatusCode.Unauthorized)
      .send(setError(HttpStatusCode.Unauthorized, AUTH_BAD_00));
  else {
    const valid = dayjs(timestamp as string, format, true).isValid();
    const notExpired = dayjs(timestamp as string).isAfter(
      dayjs().subtract(3, 'm')
    );

    if (valid && notExpired) next();
    else
      res
        .status(HttpStatusCode.Unauthorized)
        .send(setError(HttpStatusCode.Unauthorized, AUTH_BAD_01));
  }
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const verifyApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { headers } = req;
  const apikey = headers.apikey;
  const API_KEY = process.env.API_KEY;

  if (!apikey)
    res
      .status(HttpStatusCode.Unauthorized)
      .send(setError(HttpStatusCode.Unauthorized, AUTH_BAD_00));
  else {
    if (apikey === API_KEY) next();
    else
      res
        .status(HttpStatusCode.Unauthorized)
        .send(setError(HttpStatusCode.Unauthorized, AUTH_BAD_00));
  }
};
