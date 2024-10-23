import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';

export default class LogController extends Api {

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public sampleEvents = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const username: string = req.userAccount.username;
      await this.sendQueueEvents(res, username, undefined, HttpStatusCode.Ok, LogController.name)
    } catch (error) {
      next(error);
    }
  };
}
