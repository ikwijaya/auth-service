import { type NextFunction, type Request, type Response } from 'express';
import { HttpStatusCode } from 'axios';
import prisma from '@/lib/prisma';
import { IApiError } from '@/lib/errors';
import { ITierLimit, IWorkerApi } from '@/dto/common.dto';

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const verifyRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers.PAPI_KEY;
  next();

  // if (!apiKey) res
  //     .status(HttpStatusCode.BadGateway)
  //     .send({ rawErrors: [`Bad Gateway`] });

  // const ev = new UseQueryEvents()
  // const username: string = req.userAccount.username ?? 'rate.limit';
  // const payload: IWorkerApi = {
  //   method: 'GET',
  //   path: '/v1/project',
  //   body: {},
  //   headers: {
  //     apikey: apiKey
  //   }
  // }
  // const _res = await ev.sendQueueEvents<ITierLimit>(username, process.env.Q_MARKETPLACE, payload);
  // // const _res = await marketPlace.getProjectId(req.userAccount, apiKey as string).catch(e => { throw e });
  // const rateCount = await prisma.rateLimit.count({ where: { projectId: _res.id } }).catch(e => { throw e });

  // if (_res.tierLimit > rateCount) next()
  // else res
  //     .status(HttpStatusCode.TooManyRequests)
  //     .send({ rawErrors: ["Max tier limit is excedeed"], stack: { limit: _res.tierLimit } as any } as IApiError);
};
