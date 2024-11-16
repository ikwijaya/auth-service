import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import TypeService from './type.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import {
  type IQuerySearch,
  type IPagination,
  type IDataWithPagination,
  type IMessages,
} from '@/dto/common.dto';
import { type CreateTypeDto, type UpdateTypeDto } from '@/dto/type.dto';
import { type IMatrixMenu } from '@/dto/access.dto';
import { type IApiError } from '@/lib/errors';

export default class TypeController extends Api {
  private readonly typeService = new TypeService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public load = async (
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

      const value = await this.typeService
        .load(req.userAccount, req.userMatrix, pagination, qs)
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
    res: CustomResponse<{
      item: unknown;
      forms: IMatrixMenu[];
    }>,
    next: NextFunction
  ) => {
    try {
      const value = await this.typeService
        .get(Number(req.params.id))
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
  public create = async (
    req: Request,
    res: CustomResponse<{
      id: number;
      name: string;
      mode?: string | undefined;
    }>,
    next: NextFunction
  ) => {
    try {
      const value = await this.typeService
        .create(req.userAccount, req.body as CreateTypeDto)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Created);
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
    res: CustomResponse<{
      groups: Array<{
        id: number;
        name: string;
      }>;
      forms: IMatrixMenu[];
    }>,
    next: NextFunction
  ) => {
    try {
      const value = await this.typeService
        .support(req.userAccount)
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
    res: CustomResponse<IApiError | IMessages>,
    next: NextFunction
  ) => {
    try {
      const value = await this.typeService
        .update(
          req.userAccount,
          req.body as UpdateTypeDto,
          Number(req.params.id)
        )
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
  public delPersistent = async (
    req: Request,
    res: CustomResponse<IApiError | IMessages>,
    next: NextFunction
  ) => {
    try {
      const value = await this.typeService
        .delPersistent(req.userAccount, Number(req.params.id))
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
  public _download = async (
    req: Request,
    res: CustomResponse<IDataWithPagination>,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, keyword } = req.query;
      const qs: IQuerySearch = {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        keyword: keyword as string | undefined,
      };

      const value = await this.typeService
        .download(req.userAccount, qs)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
