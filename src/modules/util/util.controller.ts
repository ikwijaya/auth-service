import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import UtilService from './util.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';

export default class Utilontroller extends Api {
  private readonly utilService = new UtilService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public verify = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.utilService
        .verifyUser(req.userAccount, req.params.username)
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
  public verifyLdap = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.utilService
        .verifyLdap(req.userAccount, req.params.username)
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
  public metrics = async (
    req: Request,
    res: CustomResponse<boolean>,
    next: NextFunction
  ) => {
    try {
      const value = await this.utilService.metric().catch((e) => {
        throw e;
      });

      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
