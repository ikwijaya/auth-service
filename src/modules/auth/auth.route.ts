import { Router } from 'express';
import Controller from './auth.controller';
import { LoginDto } from '@/dto/auth.dto';
import RequestValidator from '@/middlewares/request-validator';
import { verifyAccount } from '@/middlewares/auth';
import { rateLimit } from '@/lib/security';

const windowMs = 5 * 60 * 1000; /// 15 minutes
const router: Router = Router();
const controller = new Controller();

router.post(
  '/auth/login',
  rateLimit({ windowMs, limit: 25 }),
  RequestValidator.validate(LoginDto),
  controller.login
);
router.get(
  '/auth/groups/:username',
  rateLimit({ windowMs, limit: 25 }),
  controller.groups
);

router.get('/auth/logout', verifyAccount, controller.logout);

export default router;
