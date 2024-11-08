import { Router } from 'express';
import Controller from './user.controller';
import MatrixValidator from '@/middlewares/matrix-validator';
import { verifyAccount } from '@/middlewares/auth';
import { ROLE_ACTION } from '@/enums/role.enum';

const router: Router = Router();
const controller = new Controller();

// router.get(
//   '/master/users',
//   verifyAccount,
//   MatrixValidator.validate(ROLE_ACTION.read),
//   controller.load
// );
router.get(
  '/master/user/support',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.support
);
router.post('/user/page-validate', controller.pageValidate);
router.get('/user/me', verifyAccount, controller.me);
router.get('/user/menu', verifyAccount, controller.menu);

export default router;
