import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import UserService from './user.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type IPagination } from '@/dto/common.dto';
import { type PageValidateDto } from '@/dto/user.dto';

export default class UserController extends Api {
  private readonly userService = new UserService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public load = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const { page, pageSize } = req.query;
      const pagination: IPagination = {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 25,
      };

      const value = await this.userService
        .load(req.userAccount, req.userMatrix, pagination, req.query)
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
  public me = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const value = await this.userService.me(req.userAccount).catch((e) => {
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
  public menu = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const value = await this.userService.menu(req.userAccount).catch((e) => {
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
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const value = await this.userService
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
  public pageValidate = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const value = await this.userService
        .pageValidate(req.body as PageValidateDto)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
