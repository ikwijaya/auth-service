import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import { PushNotifService } from './notif.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type IDataWithPagination } from '@/dto/common.dto';

export default class PushNotifController extends Api {
  private readonly typeService = new PushNotifService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public push = async (
    req: Request,
    res: CustomResponse<IDataWithPagination>,
    next: NextFunction
  ) => {
    try {
      const value = await this.typeService
        .send(req.userAccount, req.body)
        .catch((e) => {
          throw e;
        });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
