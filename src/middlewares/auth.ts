import { type NextFunction, type Request, type Response } from 'express';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { type IApiError } from '@/lib/errors';
import { type IJwtVerify } from '@/dto/common.dto';
import { AuthValidate } from '@/lib/auth';
import {
  AUTH_FAIL_00,
  AUTH_FAIL_01,
  TOKEN_FAIL_01,
  TOKEN_FAIL_02,
} from '@/utils/constants';

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const verifyMinimal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { headers } = req;
  const authorization = headers['authorization'];
  const token = authorization?.split(' ')[1]

  if (!token)
    res
      .status(HttpStatusCode.Unauthorized)
      .send({ rawErrors: [TOKEN_FAIL_01] });
  else {
    Jwt.verify(
      token as string,
      process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
      async function (err, verify: IJwtVerify) {
        if (err)
          res.status(HttpStatusCode.BadGateway).send({
            rawErrors: [AUTH_FAIL_00],
            stack: err.message,
            relogin: true,
          } as IApiError);
        else {
          const ipAddress: string | undefined = req.headers['x-forwarded-for'] as string | undefined ?? req.socket.remoteAddress;
          const userAgent: string | undefined = req.headers['user-agent']
          const authValidate = new AuthValidate(process.env.REDIS_SID_TTL, token as string);
          const _verify: IJwtVerify = await authValidate.minValidate(verify).catch((e) => {
            throw e;
          });

          _verify.device = userAgent
          _verify.ipAddress = ipAddress
          delete _verify.iat;
          delete _verify.exp;

          const _token = Jwt.sign(
            _verify,
            process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
            { expiresIn: process.env.JWT_EXPIRE }
          );

          req.jwtToken = _token;
          req.jwtVerify = _verify;
          next();
        }
      }
    );
  }
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const verifyAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const method: string = req.method;
  const { headers } = req;
  const authorization = headers['authorization'];
  const token = authorization?.split(' ')[1]
  const formId = headers.formid as string | undefined;

  if (!token)
    res
      .status(HttpStatusCode.Unauthorized)
      .send({ rawErrors: [TOKEN_FAIL_01] });
  else {
    Jwt.verify(
      token,
      process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
      async function (err, verify: IJwtVerify) {
        if (err)
          res.status(HttpStatusCode.BadGateway).send({
            rawErrors: [AUTH_FAIL_00],
            stack: err.message,
          } as IApiError);
        else {
          if (verify != null && verify?.id) {
            const userId = verify.id;
            const username = verify.username;
            const authValidate = new AuthValidate('10m', token);
            const { relogin, payload } = await authValidate.validate(
              userId,
              token,
              formId,
              verify.groupId,
              username
            ).catch((e) => {
              throw e;
            });

            /**
             * add mechanism, session is destroyed
             */
            if (relogin)
              res
                .status(HttpStatusCode.Unauthorized)
                .send({ rawErrors: [AUTH_FAIL_00], relogin });
            else {
              if (!payload)
                res
                  .status(HttpStatusCode.Unauthorized)
                  .send({ rawErrors: [AUTH_FAIL_01] });
              else {
                const ipAddress: string | undefined = req.headers['x-forwarded-for'] as string | undefined ?? req.socket.remoteAddress;
                const userAgent: string | undefined = req.headers['user-agent']

                payload.token = req.jwtToken;
                payload.ipAddress = ipAddress;
                payload.device = userAgent;

                req.userAccount = payload;
                req.jwtVerify = verify;
                next();
              }
            }
          } else
            res
              .status(HttpStatusCode.Unauthorized)
              .send({ rawErrors: [TOKEN_FAIL_02] });
        }
      }
    );
  }
};
