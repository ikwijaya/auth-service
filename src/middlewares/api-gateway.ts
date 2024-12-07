import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import Jwt from 'jsonwebtoken';
import { setError } from '@/lib/errors';
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import {
  type IUserMatrix,
  type IUserAccount,
  type IJwtCommunicator,
} from '@/dto/common.dto';
import { MATRIX_FAIL_01 } from '@/utils/constants';

export default class APIGateway {
  /**
   * use for generating userMatrix which is consumed in others API
   * @returns
   */
  static build = () => {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const auth: IUserAccount = req.userAccount;
        if (!auth.typeId && !auth.formId)
          next(setError(HttpStatusCode.BadRequest, MATRIX_FAIL_01));
        else {
          if (!auth.formId)
            next(setError(HttpStatusCode.BadRequest, MATRIX_FAIL_01));
          else if (!auth.typeId)
            next(setError(HttpStatusCode.BadRequest, MATRIX_FAIL_01));
          else {
            const matrix: IUserMatrix = await buildMatrix(
              auth.typeId,
              auth.formId
            ).catch((e) => {
              throw e;
            });

            /**
             * build new jwt
             * for communicate with microservices
             */
            logger.info('matrix for proxies: ' + auth.username);
            logger.info(JSON.stringify(matrix));

            const jwtVerify = req.jwtVerify;
            delete jwtVerify.iat;
            delete jwtVerify.exp;

            const jwtCommunicator: IJwtCommunicator = {
              userMatrix: matrix,
              ...jwtVerify,
            };

            const value = Jwt.sign(jwtCommunicator, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRE,
            });

            req.headers = {
              authorization: 'Bearer ' + value,
            };

            next();
          }
        }
      } catch (e) {
        logger.error(e);
        next(setError(HttpStatusCode.BadRequest, MATRIX_FAIL_01, e.message));
      }
    };
  };
}

/**
 *
 * @param typeId
 * @param formId
 * @returns
 */
const buildMatrix = async (
  typeId: number | undefined,
  formId: number | undefined
): Promise<IUserMatrix> => {
  const matrix: IUserMatrix = {};
  const object: IUserMatrix = {};
  const access = await prisma.access
    .findMany({
      select: {
        formId: true,
        roleAction: true,
        roleValue: true,
      },
      where: {
        formId: formId ? Number(formId) : undefined,
        typeId,
        recordStatus: 'A',
      },
    })
    .catch((e) => {
      throw e;
    });

  access.forEach((e) => {
    object[e.roleAction] = e.roleValue;
  });

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      if (key === 'C') matrix.is_create = object[key];
      if (key === 'R') matrix.is_read = object[key];
      if (key === 'U') matrix.is_update = object[key];
      if (key === 'D') matrix.is_delete = object[key];
      if (key === 'A') matrix.is_upload = object[key];
      if (key === 'B') matrix.is_download = object[key];
    }
  }

  return matrix;
};
