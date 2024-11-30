import { Router } from 'express';
import Controller from './security.controller';
import { verifyAccount } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';
import { PageValidateDto } from '@/dto/user.dto';
import { ROLE_ACTION, ROLE_USER } from '@/enums/role.enum';
import PrivilegeValidator from '@/middlewares/privilege-validator';
import MatrixValidator from '@/middlewares/matrix-validator';

const router: Router = Router();
const controller = new Controller();

router.post(
  '/security/page-validate',
  RequestValidator.validate(PageValidateDto),
  controller.pageValidate
);
router.get('/security/me', verifyAccount, controller.me);
router.get('/security/menu', verifyAccount, controller.menu);
router.get(
  '/security/jwt',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  PrivilegeValidator.validate([ROLE_USER.SUPERADMIN]),
  controller.jwtCommunicator
);

export default router;
