import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import { setError } from '@/lib/errors';
import logger from '@/lib/logger';
import { type IUserAccount } from '@/dto/common.dto';
import { PRIV_FAIL_00, PRIV_FAIL_01 } from '@/utils/constants';
import { type ROLE_USER } from '@/enums/role.enum';

export default class PrivilegeValidator {
  static validate = (privilegesType: ROLE_USER[]) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const auth: IUserAccount = req.userAccount;
        if (!auth.type?.mode)
          next(setError(HttpStatusCode.BadGateway, PRIV_FAIL_00));
        else {
          const valid =
            privilegesType.filter((e) => e === auth.type?.mode).length > 0;
          if (valid) next();
          else next(setError(HttpStatusCode.BadGateway, PRIV_FAIL_01));
        }
      } catch (e) {
        logger.error(e);
        next(setError(HttpStatusCode.BadGateway, e.message));
      }
    };
  };
}
