import { type NextFunction, type Request } from 'express';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { BullService } from '@/modules/bull/bull.service';

export default class LogController extends Api {
  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public login = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const bullService = new BullService();
      const value = await bullService.get(req.body).catch((e) => {
        throw e;
      });
      if (value) res.redirect(process.env.APP_BASE_URL + '/monitoring');
      else res.redirect('/not-found');
    } catch (error) {
      res.redirect('/not-found');
    }
  };
}
