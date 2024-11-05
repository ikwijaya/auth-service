import { type NextFunction, type Request, type Response } from 'express';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { TOKEN_FAIL_01 } from '@/utils/constants';

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
    res
      .status(HttpStatusCode.Unauthorized)
      .send({ rawErrors: [TOKEN_FAIL_01] });
  else {
    Jwt.verify(
      token,
      process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
      function (err) {
        if (err)
          res
            .status(HttpStatusCode.BadGateway)
            .send({ rawErrors: [err.message] });
        else {
          req.jwtToken = token;
          next();
        }
      }
    );
  }
};
