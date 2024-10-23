import { Router } from 'express';
import Controller from './log.controller';
import MatrixValidator from '@/middlewares/matrix-validator';
import { verifyAccount } from '@/middlewares/auth';
import { ROLE_ACTION } from '@/enums/role.enum'

const router: Router = Router();
const controller = new Controller();

router.get(
  '/sample-events',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.sampleEvents
);

export default router;
