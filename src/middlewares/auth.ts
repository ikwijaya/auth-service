import { type NextFunction, type Request, type Response } from 'express';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { type IApiError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import { type IJwtVerify, type IUserAccount } from '@/dto/common.dto';
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
export const verifyJwtToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { headers } = req;
  const token = headers.token;

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
          const _verify: IJwtVerify = await fetchMinimal(verify).catch((e) => {
            throw e;
          });

          _verify.device = userAgent
          _verify.ipAddress = ipAddress
          delete _verify.iat;
          delete _verify.exp;

          if (verify.type === 'app-cms') {
            const _token = Jwt.sign(
              _verify,
              process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
              { expiresIn: process.env.JWT_EXPIRE }
            );

            req.jwtToken = _token;
            req.jwtVerify = _verify;
            next();
          } else
            throw {
              rawErrors: [TOKEN_FAIL_02],
            } as IApiError;
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
  const token = headers.token as string | undefined;
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
            const { relogin, payload } = await fetchUAC(
              userId,
              token,
              formId,
              verify.groupId
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

/**
 *
 * @param id
 * @param token
 * @param formId
 * @returns
 */
interface IKickLogin {
  relogin: boolean;
  payload?: IUserAccount;
}

const fetchUAC = async (
  id: number,
  token: string,
  formId: undefined | string,
  groupId: number
): Promise<IKickLogin> => {
  const getUser = await prisma.user
    .findFirst({
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        ldapId: true,
      },
      where: {
        id: id,
      }
    })
    .catch((e) => {
      throw e;
    })

  const getUserGroup = await prisma.userGroup.findFirst({
    select: {
      typeId: true,
      type: {
        select: {
          name: true,
          flag: true,
          mode: true
        }
      },
      groupId: true,
      group: {
        select: {
          name: true,
        }
      },
    },
    where: {
      groupId: groupId,
      userId: id,
      recordStatus: 'A',
      actionCode: 'APPROVED'
    },
    orderBy: {
      checkedAt: 'desc'
    }
  }).catch(e => { throw e })

  const isActive = await prisma.session.findFirst({
    where: { recordStatus: 'A', token, userId: id },
  });

  if (!isActive) return { relogin: true } as IKickLogin;
  if (!getUser) return { relogin: false } as IKickLogin;
  if (!getUserGroup) return { relogin: false } as IKickLogin;

  const user: IUserAccount = {
    id: id,
    userId: getUser.id,
    token: token,
    username: getUser.username,
    fullname: getUser.fullname,
    email: getUser.email,
    ldapId: getUser.ldapId,
    typeId: getUserGroup.typeId,
    type: getUserGroup.type,
    groupId: groupId,
    group: getUserGroup.group
  }

  if (formId) user.formId = Number(formId);
  return { relogin: false, payload: user } as IKickLogin;
};

/**
 *
 * @param ijwt
 */
const fetchMinimal = async (ijwt: IJwtVerify) => {
  const getUser = await prisma.user
    .findFirst({
      select: {
        email: true,
      },
      where: { id: ijwt.id },
    })
    .catch((e) => {
      throw e;
    });

  const getUserGroup = await prisma.userGroup.findFirst({
    select: {
      typeId: true,
      type: {
        select: {
          name: true,
          flag: true,
          mode: true
        }
      },
      groupId: true,
      group: {
        select: {
          name: true,
        }
      },
    },
    where: {
      groupId: ijwt.groupId,
      userId: ijwt.id,
      recordStatus: 'A',
      actionCode: 'APPROVED'
    },
    orderBy: {
      checkedAt: 'desc'
    }
  }).catch(e => { throw e })

  return {
    ...ijwt,
    email: getUser?.email,
    privilegeName: getUserGroup?.type.name,
  } as IJwtVerify;
};
