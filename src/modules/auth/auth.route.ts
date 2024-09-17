import { Router } from 'express';
import Controller from './auth.controller';
import { LoginDto } from '@/dto/auth.dto';
import RequestValidator from '@/middlewares/request-validator';
import { verifyJwtToken } from '@/middlewares/auth';
import { rateLimit } from '@/lib/security';
import { verifyTimestamp } from '@/middlewares/default';

const windowMs = 5 * 60 * 1000; /// 15 minutes
const router: Router = Router();
const controller = new Controller();

router.post(
  '/auth/login',
  rateLimit({ windowMs, limit: 50 }),
  verifyTimestamp,
  RequestValidator.validate(LoginDto),
  controller.login
);

router.get('/auth/logout', verifyJwtToken, controller.logout);

export default router;
