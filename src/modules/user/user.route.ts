import { Router } from 'express';
import Controller from './user.controller';
import MatrixValidator from '@/middlewares/matrix-validator';
import { verifyAccount, verifyJwtToken } from '@/middlewares/auth';
import { ROLE_ACTION } from '@/enums/role.enum'

const router: Router = Router();
const controller = new Controller();

router.get(
  '/master/users',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.load
);
router.get(
  '/master/user/support',
  verifyJwtToken,
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.support
);
router.post('/user/page-validate', controller.pageValidate);
router.get('/user/me', verifyJwtToken, verifyAccount, controller.me);
router.get('/user/menu', verifyJwtToken, verifyAccount, controller.menu);

export default router;
