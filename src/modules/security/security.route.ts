import { Router } from 'express';
import Controller from './security.controller';
import { verifyAccount } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';
import { PageValidateDto } from '@/dto/user.dto';
import { ROLE_USER } from '@/enums/role.enum';
import PrivilegeValidator from '@/middlewares/privilege-validator';

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
  PrivilegeValidator.validate([ROLE_USER.SUPERADMIN]),
  controller.jwtCommunicator
);

export default router;
