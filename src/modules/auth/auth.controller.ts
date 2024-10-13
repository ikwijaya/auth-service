import { type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import AuthService from './auth.service';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import { type LoginResDto, type LogoutResDto } from '@/dto/auth.dto';
import { ImpersonateService } from './impersonate.service';

export default class AuthController extends Api {
  private readonly authService = new AuthService();
  private readonly impersonateService = new ImpersonateService();

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public login = async (
    req: Request,
    res: CustomResponse<LoginResDto>,
    next: NextFunction
  ) => {
    try {
      const value = await this.authService.login(req.body).catch((e) => {
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
  public impersonate = async (
    req: Request,
    res: CustomResponse<LoginResDto>,
    next: NextFunction
  ) => {
    try {
      const value = await this.impersonateService.impersonate(req.userAccount, Number(req.params.id)).catch((e) => {
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
  public groups = async (
    req: Request,
    res: CustomResponse<LoginResDto>,
    next: NextFunction
  ) => {
    try {
      const value = await this.impersonateService.groups(req.userAccount).catch((e) => {
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
  public logout = async (
    req: Request,
    res: CustomResponse<LogoutResDto>,
    next: NextFunction
  ) => {
    try {
      const value = await this.authService.logout(req.jwtToken).catch((e) => {
        throw e;
      });
      this.send(res, value, HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };
}
