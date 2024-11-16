import { HttpStatusCode } from 'axios';
import { type Request, type NextFunction } from 'express';
import CreateUserService from './create.service';
import GetAllUserService from './get-all.service';
import GetUserService from './get.service';
import UpdateUserService from './update.service';
import DisableUserService from './disable.service';
import SupportUserService from './support.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import {
  type IDataWithPagination,
  type IPagination,
  type IQuerySearch,
} from '@/dto/common.dto';

export default class UserController extends Api {
  private readonly createUserService = new CreateUserService();
  private readonly getAllUserService = new GetAllUserService();
  private readonly getUserService = new GetUserService();
  private readonly updateUserService = new UpdateUserService();
  private readonly endisUserService = new DisableUserService();
  private readonly supportUserService = new SupportUserService();

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

      const value = await this.getAllUserService
        .getAll(req.userAccount, req.userMatrix, pagination, qs)
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
      const value = await this.getUserService.get(parseInt(id)).catch((e) => {
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
  public create = async (
    req: Request,
    res: CustomResponse<unknown>,
    next: NextFunction
  ) => {
    try {
      const value = await this.createUserService
        .create(req.userAccount, req.body)
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
  public update = async (
    req: Request,
    res: CustomResponse<unknown>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const value = await this.updateUserService
        .update(req.userAccount, parseInt(id), req.body)
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
  public disable = async (
    req: Request,
    res: CustomResponse<unknown>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const value = await this.endisUserService
        .endis(req.userAccount, parseInt(id), false)
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
  public enable = async (
    req: Request,
    res: CustomResponse<unknown>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const value = await this.endisUserService
        .endis(req.userAccount, parseInt(id), true)
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
  public support = async (
    req: Request,
    res: CustomResponse<unknown>,
    next: NextFunction
  ) => {
    try {
      const value = await this.supportUserService
        .getGroupWithRole(req.userAccount)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
