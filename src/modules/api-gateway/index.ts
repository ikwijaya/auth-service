import { Router } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import { createJwtForGateway } from '@/middlewares/default';
import { verifyAccount } from '@/middlewares/auth';
import logger from '@/lib/logger';

const JsonGateway = process.env.API_GATEWAY;
const itemsGateway: Options[] = JSON.parse(JsonGateway);
const router: Router = Router();
itemsGateway.forEach((e: Options) => {
  logger.info(e.target);
  router.use('/', verifyAccount, createJwtForGateway, createProxyMiddleware(e));
});

export default router;
