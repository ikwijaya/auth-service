import { Router } from 'express';
import Controller from './util.controller';
import { verifyAccount, verifyJwtToken } from '@/middlewares/auth';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/util/ldap-search/:username',
  verifyJwtToken,
  verifyAccount,
  controller.verify
);

router.get(
  '/util/ldap-verify/:username',
  verifyJwtToken,
  verifyAccount,
  controller.verifyLdap
);

export default router;
