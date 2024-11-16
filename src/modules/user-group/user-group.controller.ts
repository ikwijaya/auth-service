import { HttpStatusCode } from 'axios';
import { type Request, type NextFunction } from 'express';
import GetAllUserGroupService from './get-all.service';
import GetUserGroupService from './get.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import {
  type IDataWithPagination,
  type IPagination,
  type IQuerySearch,
} from '@/dto/common.dto';

export default class UserGroupController extends Api {
  private readonly getAllUserGroupService = new GetAllUserGroupService();
  private readonly getUserGroupService = new GetUserGroupService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public getAll = async (
    req: Request,
    res: CustomResponse<IDataWithPagination>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
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

      const value = await this.getAllUserGroupService
        .getAll(req.userAccount, parseInt(id), req.userMatrix, pagination, qs)
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
  public get = async (
    req: Request,
    res: CustomResponse<unknown>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const value = await this.getUserGroupService
        .get(parseInt(id))
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
