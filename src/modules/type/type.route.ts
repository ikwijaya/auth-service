import { Router } from 'express';
import Controller from './type.controller';
import RequestValidator from '@/middlewares/request-validator';
import MatrixValidator from '@/middlewares/matrix-validator';
import { verifyAccount } from '@/middlewares/auth';
import { CreateTypeDto, UpdateTypeDto } from '@/dto/type.dto';
import { ROLE_ACTION } from '@/enums/role.enum';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/master/types',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.load
);
router.get(
  '/master/types/download',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller._download
);
router.get(
  '/master/type/support',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.support
);
router.get(
  '/master/type/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.get
);
router.post(
  '/master/type',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.create),
  RequestValidator.validate(CreateTypeDto),
  controller.create
);
router.put(
  '/master/type/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.update),
  RequestValidator.validate(UpdateTypeDto),
  controller.update
);
router.delete(
  '/master/type/:id/persist',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.delete),
  controller.delPersistent
);

export default router;
