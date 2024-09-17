import { Router } from 'express';
import Controller from './group.controller';
import RequestValidator from '@/middlewares/request-validator';
import MatrixValidator from '@/middlewares/matrix-validator';
import { verifyAccount, verifyJwtToken } from '@/middlewares/auth';
import { CreateGroupDto, UpdateGroupDto } from '@/dto/group.dto';
import { ROLE_ACTION } from '@/enums/role.enum'

const router: Router = Router();
const controller = new Controller();

router.get(
  '/master/groups',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.load
);
router.get(
  '/master/groups/download',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller._download
);
router.get(
  '/master/group/support',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.support
);
router.get(
  '/master/group/:id',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.get
);
router.post(
  '/master/group',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  RequestValidator.validate(CreateGroupDto),
  controller.create
);
router.patch(
  '/master/group/:id',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  RequestValidator.validate(UpdateGroupDto),
  controller.update
);
router.delete(
  '/master/group/:id/persist',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.delPersistent
);

export default router;
