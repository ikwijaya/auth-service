import { type NextFunction, type Request } from 'express';
import Jwt from 'jsonwebtoken';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type IJwtCommunicator, type IWorkerApi } from '@/dto/common.dto';
import { BullService } from '@/modules/log/bull.service';

export default class LogController extends Api {
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
      const jwtVerify = req.jwtVerify;
      delete jwtVerify.iat;
      delete jwtVerify.exp;

      const jwtCommunicator: IJwtCommunicator = {
        userMatrix: req.userMatrix,
        ...jwtVerify,
      };
      const token = Jwt.sign(jwtCommunicator, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });
      const payload: IWorkerApi = {
        method: req.method,
        path: req.originalUrl,
        body: req.body,
        headers: { Authorization: 'Bearer ' + token },
      };

      const username: string = req.userAccount.username;
      void this.sendQueueEvents(res, username, process.env.Q_LOG, payload);
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
  public add = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const jwtVerify = req.jwtVerify;
      delete jwtVerify.iat;
      delete jwtVerify.exp;

      const jwtCommunicator: IJwtCommunicator = {
        userMatrix: req.userMatrix,
        ...jwtVerify,
      };
      const token = Jwt.sign(jwtCommunicator, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });
      const payload: IWorkerApi = {
        method: req.method,
        path: req.originalUrl,
        body: req.body,
        headers: { Authorization: 'Bearer ' + token },
      };

      const username: string = req.userAccount.username;
      void this.sendQueueEvents(res, username, process.env.Q_LOG, payload);
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
      if (value) res.redirect('/monitoring');
      else res.redirect('/not-found');
    } catch (error) {
      res.redirect('/not-found');
    }
  };
}
