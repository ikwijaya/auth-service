import { Router } from 'express';
import Controller from './impersonate.controller';
import { verifyAccount } from '@/middlewares/auth';
import { rateLimit } from '@/lib/security';

const windowMs = 5 * 60 * 1000; /// 5 minutes
const router: Router = Router();
const controller = new Controller();

router.put(
  '/impersonate/:group_id',
  rateLimit({ windowMs, limit: 10 }),
  verifyAccount,
  controller.impersonate
);
router.get('/impersonate/groups', verifyAccount, controller.groups);

export default router;
