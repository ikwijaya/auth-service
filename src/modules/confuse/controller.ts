import { HttpStatusCode } from 'axios';
import { type Request, type NextFunction } from 'express';
import ApprovalService from './approve.service';
import RejectService from './reject.service';
import ListConfuseService from './lists.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import {
  type IPagination,
  type IQuerySearch,
  type IDataWithPagination,
} from '@/dto/common.dto';

export default class UserConsentController extends Api {
  private readonly approveService = new ApprovalService();
  private readonly rejectService = new RejectService();
  private readonly listService = new ListConfuseService();

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

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public findAll = async (
    req: Request,
    res: CustomResponse<IDataWithPagination>,
    next: NextFunction
  ) => {
    try {
      const { page, pageSize } = req.query;
      const pagination: IPagination = {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 25,
      };

      const { startDate, endDate, keyword } = req.query;
      const qs: IQuerySearch = {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        keyword: keyword as string | undefined,
      };

      const value = await this.listService
        .findAll(req.userAccount, req.userMatrix, pagination, qs)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
