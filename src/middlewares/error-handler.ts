import util from 'util';
import { type NextFunction, type Request, type Response } from 'express';
import { HttpStatusCode } from 'axios';
import { type ApiError } from '@/lib/errors';
import logger from '@/lib/logger';

const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.password) delete req.body.password;

  logger.error(`Request Error:
        \nError: ${JSON.stringify(err)}
        \nHeaders: ${util.inspect(req.headers)}
        \nParams: ${util.inspect(req.params)}
        \nQuery: ${util.inspect(req.query)}
        \nBody: ${util.inspect(req.body)}
        \nUserAccount: ${util.inspect(req.userAccount)}
        \nUserMatrix: ${util.inspect(req.userMatrix)}
        \nJwtToken: ${util.inspect(req.jwtToken)}
        \nJwtVerify: ${util.inspect(req.jwtVerify)}`);

  const status: number = err.statusCode ?? HttpStatusCode.InternalServerError;
  res.status(status).send(err);

  next();
};

export default errorHandler;
