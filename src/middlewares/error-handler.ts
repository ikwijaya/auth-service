import util from 'util';
import { type NextFunction, type Request, type Response } from 'express';
import { HttpStatusCode } from 'axios';
import chalk from 'chalk';
import { type ApiError } from '@/lib/errors';
import logger from '@/lib/logger';

const chalkRed = chalk.yellow;
const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.password) delete req.body.password;
  const chalkErr = chalkRed(`Request Error: 
  \nPath: ${req.path}
  \nError: ${chalk.whiteBright.italic.bgRedBright(JSON.stringify(err))}
  \nHeaders: ${util.inspect(req.headers)}
  \nParams: ${util.inspect(req.params)}
  \nQuery: ${util.inspect(req.query)}
  \nBody: ${util.inspect(req.body)}
  \nUserAccount: ${util.inspect(req.userAccount)}
  \nUserMatrix: ${util.inspect(req.userMatrix)}
  \nJwtToken: ${util.inspect(req.jwtToken)}
  \nJwtVerify: ${util.inspect(req.jwtVerify)}`);

  logger.warn(chalkErr);
  const status: number = err.statusCode ?? HttpStatusCode.InternalServerError;
  res.status(status).send(err);

  next();
};

export default errorHandler;
