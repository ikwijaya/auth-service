import { type NextFunction, type Request, type Response } from 'express';
import { HttpStatusCode } from 'axios';
import { MarketPlaceService } from '@/modules/market-place.service';
import prisma from '@/lib/prisma';
import { IApiError } from '@/lib/errors';

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
    const marketPlace = new MarketPlaceService()
    const apiKey = req.headers.PAPI_KEY;

    if (!apiKey) res
        .status(HttpStatusCode.BadGateway)
        .send({ rawErrors: [`Bad Gateway`] });

    const _res = await marketPlace.getProjectId(req.userAccount, apiKey as string).catch(e => { throw e });
    const rateCount = await prisma.rateLimit.count({ where: { projectId: _res.id } }).catch(e => { throw e });

    if (_res.tierLimit > rateCount) next()
    else res
        .status(HttpStatusCode.TooManyRequests)
        .send({ rawErrors: ["Max tier limit is excedeed"], stack: { limit: _res.tierLimit } as any } as IApiError);
};
