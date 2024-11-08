import { type NextFunction, type Request, type Response } from 'express';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { TOKEN_FAIL_01 } from '@/utils/constants';
import { setError } from '@/lib/errors';

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const verifyInternalToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { headers } = req;
  const authorization = headers.authorization;
  const token = authorization?.split(' ')[1];

  if (!token)
    res.send(setError(HttpStatusCode.Unauthorized, TOKEN_FAIL_01, true));
  else {
    Jwt.verify(
      token,
      process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
      function (err) {
        if (err)
          res.send(setError(HttpStatusCode.Unauthorized, err.message, true));
        else {
          req.jwtToken = token;
          next();
        }
      }
    );
  }
};
