import { type NextFunction, type Request } from 'express';
import { type CustomResponse } from '@/types/common.type';
import Api, { IWorkerApi, WorkerMethod } from '@/lib/api';
import Jwt from 'jsonwebtoken';
import { IJwtCommunicator } from '@/dto/common.dto';

export default class LogController extends Api {

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public appLogs = async (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => {
    try {
      const jwtVerify = req.jwtVerify
      delete jwtVerify.iat
      delete jwtVerify.exp

      const jwtCommunicator: IJwtCommunicator = { userMatrix: req.userMatrix, jwtVerify: req.jwtVerify }
      const token = Jwt.sign(jwtCommunicator, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
      const payload: IWorkerApi = {
        method: WorkerMethod.GET,
        path: req.originalUrl,
        body: req.body,
        headers: { Authorization: 'Bearer ' + token }
      }

      const username: string = req.userAccount.username;
      this.sendQueueEvents(res, username, process.env.LOG_SERVICE_NAME, payload)
    } catch (error) {
      next(error);
    }
  };
}
