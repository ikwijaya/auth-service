import { Router } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import { verifyAccount } from '@/middlewares/auth';
import logger from '@/lib/logger';
import APIGateway from '@/middlewares/api-gateway';

const JsonGateway = process.env.API_GATEWAY;
const itemsGateway: Options[] = JSON.parse(JsonGateway);
const router: Router = Router();
itemsGateway.forEach((e: Options) => {
  logger.info(e.target);
  router.use(verifyAccount, APIGateway.build(), createProxyMiddleware(e));
});

export default router;
