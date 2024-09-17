import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import WizardService from './wizard.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';

export default class WizardController extends Api {
  private readonly wizardService = new WizardService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public run = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const value = await this.wizardService.run(req.body).catch((e) => {
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
  public execute = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const value = await this.wizardService.execute(req.body).catch((e) => {
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
      const value = await this.wizardService.support(req.body).catch((e) => {
        throw e;
      });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
