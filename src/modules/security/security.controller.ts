import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import Jwt from 'jsonwebtoken';
import SecurityService from './security.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type IJwtCommunicator, type IUserAccount } from '@/dto/common.dto';

export interface IMenuItem {
  id: number;
  name: string;
  url: string | null;
  icon: string | null;
  color: string | null;
  sort: number;
  childs: Array<{
    id: number;
    name: string;
    url: string | null;
    icon: string | null;
    color: string | null;
    sort: number;
  }>;
}

export default class SecurityController extends Api {
  private readonly securityService = new SecurityService();
  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public me = async (
    req: Request,
    res: CustomResponse<IUserAccount>,
    next: NextFunction
  ) => {
    try {
      const value = await this.securityService
        .me(req.userAccount)
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
  public menu = async (
    req: Request,
    res: CustomResponse<IMenuItem[]>,
    next: NextFunction
  ) => {
    try {
      const value = await this.securityService
        .menu(req.userAccount)
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
    res: CustomResponse<{
      id: number;
      name: string;
      url: string | null;
    } | null>,
    next: NextFunction
  ) => {
    try {
      const value = await this.securityService
        .pageValidate(req.body)
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
  public jwtCommunicator = async (
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
      const value = Jwt.sign(jwtCommunicator, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });

      this.send(
        res,
        { accessToken: 'Bearer ' + value, expiresIn: process.env.JWT_EXPIRE },
        HttpStatusCode.Created
      );
    } catch (error) {
      next(error);
    }
  };
}
