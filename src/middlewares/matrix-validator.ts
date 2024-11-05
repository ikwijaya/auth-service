import { type Request, type Response, type NextFunction } from 'express';
import { HttpBadRequestError } from '@/lib/errors';
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { type IUserMatrix, type IUserAccount } from '@/dto/common.dto';
import { MATRIX_FAIL_01, MATRIX_FAIL_03 } from '@/utils/constants';
import { ROLE_ACTION } from '@/enums/role.enum';

export default class MatrixValidator {
  static validate = (roleAction: ROLE_ACTION = ROLE_ACTION.read) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
      const validationErrorText = 'not authenticated';
      try {
        const auth: IUserAccount = req.userAccount;
        if (!auth.typeId && !auth.formId)
          next(new HttpBadRequestError(validationErrorText, [MATRIX_FAIL_01]));
        else {
          if (!auth.formId)
            next(
              new HttpBadRequestError(validationErrorText, [MATRIX_FAIL_01])
            );
          else if (!auth.typeId)
            next(
              new HttpBadRequestError(validationErrorText, [MATRIX_FAIL_01])
            );
          else {
            const matrix: IFetchMatrix = await fetchMatrix(
              auth.typeId,
              auth.formId,
              roleAction
            ).catch((e) => {
              throw e;
            });

            logger.info('matrix ' + auth.username);
            logger.info(JSON.stringify(matrix.userMatrix));

            if (matrix.isAllow && matrix.userMatrix) {
              req.userMatrix = matrix.userMatrix;
              next();
            } else
              next(
                new HttpBadRequestError(validationErrorText, [MATRIX_FAIL_03])
              );
          }
        }
      } catch (e) {
        logger.error(e);
        next(new HttpBadRequestError(validationErrorText, [e.message]));
      }
    };
  };
}

interface IFetchMatrix {
  userMatrix: IUserMatrix | undefined;
  isAllow: boolean;
}

/**
 *
 * @param ctype
 * @param formId
 * @param roleAction
 * @returns
 */
const fetchMatrix = async (
  typeId: number | undefined,
  formId: number | undefined,
  roleAction: ROLE_ACTION
): Promise<IFetchMatrix> => {
  let valid: boolean = false;
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
    if (e.roleAction === roleAction && e.roleValue) valid = true;
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

  return { userMatrix: matrix, isAllow: valid };
};
