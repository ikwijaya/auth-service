import { type NextFunction, type Request, type Response } from 'express';
import mcache from 'memory-cache';
import logger from '@/lib/logger';

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const Cache = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path;
  const key: string = `${path}_${JSON.stringify(req.body)}`;
  const content = mcache.get(key);
  if (content) {
    logger.info(`cache found`);
    res.send(content);
  } else next();
};
