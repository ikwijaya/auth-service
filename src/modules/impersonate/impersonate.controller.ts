import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import ImpersonateService from '@/modules/impersonate/impersonate.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';

export default class ImpersonateController extends Api {
  private readonly service = new ImpersonateService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public impersonate = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.service
        .impersonate(req.userAccount, Number(req.params.group_id))
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public groups = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.service.groups(req.userAccount).catch((e) => {
        throw e;
      });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
