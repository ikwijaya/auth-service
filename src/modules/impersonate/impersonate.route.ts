import { Router } from 'express';
import Controller from './impersonate.controller';
import { verifyAccount, verifyJwtToken } from '@/middlewares/auth';
import { rateLimit } from '@/lib/security';

const windowMs = 5 * 60 * 1000; /// 5 minutes
const router: Router = Router();
const controller = new Controller();

router.get(
  '/impersonate/:group_id',
  rateLimit({ windowMs, limit: 10 }),
  verifyJwtToken,
  verifyAccount,
  controller.impersonate
);
router.get('/impersonate/groups', verifyJwtToken, verifyAccount, controller.groups);

export default router;
