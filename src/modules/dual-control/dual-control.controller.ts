import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import DualControlService from '@/modules/dual-control/dual-control.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type EmailResponderDto } from '@/dto/checker.dto';

export default class DualController extends Api {
  private readonly service = new DualControlService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public findChecker = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.service
        .checker(req.userAccount, Number(req.params.page_id))
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
  public findEmailResponder = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.service
        .emailResponder(req.userAccount, req.body as EmailResponderDto)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
