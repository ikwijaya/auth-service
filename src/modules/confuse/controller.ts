import { HttpStatusCode } from 'axios';
import { type Request, type NextFunction } from 'express';
import ApprovalService from './approve.service';
import RejectService from './reject.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type IDataWithPagination } from '@/dto/common.dto';

export default class UserConsentController extends Api {
  private readonly approveService = new ApprovalService();
  private readonly rejectService = new RejectService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public approve = async (
    req: Request,
    res: CustomResponse<IDataWithPagination>,
    next: NextFunction
  ) => {
    try {
      const value = await this.approveService
        .action(req.userAccount, req.body)
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
  public reject = async (
    req: Request,
    res: CustomResponse<IDataWithPagination>,
    next: NextFunction
  ) => {
    try {
      const value = await this.rejectService
        .action(req.userAccount, req.body)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
