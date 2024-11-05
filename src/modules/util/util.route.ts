import { Router } from 'express';
import Controller from './util.controller';
import { verifyAccount } from '@/middlewares/auth';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/util/ldap-search/:username',
  verifyAccount,
  controller.verify
);

router.get(
  '/util/ldap-verify/:username',
  verifyAccount,
  controller.verifyLdap
);

export default router;
