import { Router } from 'express';
import Controller from './auth.controller';
import { LoginDto } from '@/dto/auth.dto';
import RequestValidator from '@/middlewares/request-validator';
import { verifyAccount, verifyJwtToken } from '@/middlewares/auth';
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

router.get('/auth/logout', verifyJwtToken, controller.logout);
router.get(
  '/auth/impersonate/:id',
  rateLimit({ windowMs, limit: 25 }),
  verifyJwtToken,
  verifyAccount,
  controller.impersonate
);
router.get('/auth/group', verifyJwtToken, verifyAccount, controller.groups);

export default router;
