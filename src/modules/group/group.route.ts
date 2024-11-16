import { Router } from 'express';
import Controller from './group.controller';
import RequestValidator from '@/middlewares/request-validator';
import MatrixValidator from '@/middlewares/matrix-validator';
import { verifyAccount } from '@/middlewares/auth';
import { CreateGroupDto, UpdateGroupDto } from '@/dto/group.dto';
import { ROLE_ACTION, ROLE_USER } from '@/enums/role.enum';
import PrivilegeValidator from '@/middlewares/privilege-validator';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/master/groups',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.load
);
router.get(
  '/master/groups/download',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller._download
);
router.get(
  '/master/group/support',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.support
);
router.get(
  '/master/group/:id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.get
);
router.post(
  '/master/group',
  verifyAccount,
  PrivilegeValidator.validate([ROLE_USER.SUPERADMIN]),
  MatrixValidator.validate(ROLE_ACTION.create),
  RequestValidator.validate(CreateGroupDto),
  controller.create
);
router.put(
  '/master/group/:id',
  verifyAccount,
  PrivilegeValidator.validate([ROLE_USER.SUPERADMIN]),
  MatrixValidator.validate(ROLE_ACTION.update),
  RequestValidator.validate(UpdateGroupDto),
  controller.update
);
router.delete(
  '/master/group/:id/persist',
  verifyAccount,
  PrivilegeValidator.validate([ROLE_USER.SUPERADMIN]),
  MatrixValidator.validate(ROLE_ACTION.delete),
  controller.delPersistent
);

export default router;
