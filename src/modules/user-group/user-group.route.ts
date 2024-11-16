import { Router } from 'express';
import Controller from './user-group.controller';
import { verifyAccount } from '@/middlewares/auth';
import MatrixValidator from '@/middlewares/matrix-validator';
import { ROLE_ACTION } from '@/enums/role.enum';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/master/user-groups/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.getAll
);

router.get(
  '/master/user-group/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.get
);

export default router;
