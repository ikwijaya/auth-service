import { Router } from 'express';
import Controller from './controller';
import { verifyAccount } from '@/middlewares/auth';
import MatrixValidator from '@/middlewares/matrix-validator';
import { ROLE_ACTION } from '@/enums/role.enum';
import RequestValidator from '@/middlewares/request-validator';
import { ConsentDto, RefuseDto } from '@/dto/confuse';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/confuse/users',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.findAll
);

router.post(
  '/confuse/consent',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.create),
  RequestValidator.validate(ConsentDto),
  controller.approve
);

router.post(
  '/confuse/refuse',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.create),
  RequestValidator.validate(RefuseDto),
  controller.reject
);

export default router;
