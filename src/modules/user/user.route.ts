import { Router } from 'express';
import Controller from './user.controller';
import { verifyAccount } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';
import MatrixValidator from '@/middlewares/matrix-validator';
import { ROLE_ACTION } from '@/enums/role.enum';
import { CreateUserDto, UpdateUserDto } from '@/dto/user.dto';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/master/users',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.getAll
);

router.get(
  '/master/user/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.get
);

router.post(
  '/master/user',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.create),
  RequestValidator.validate(CreateUserDto),
  controller.create
);

router.put(
  '/master/user/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.update),
  RequestValidator.validate(UpdateUserDto),
  controller.update
);

router.get(
  '/master/user/:id/disable',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.update),
  controller.disable
);

router.get(
  '/master/user/:id/enable',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.update),
  controller.enable
);

router.get(
  '/master/user/support',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.support
);

export default router;
