import { Router } from 'express';
import Auth from './auth/auth.route';
import Wizard from './wizard/wizard.route';
import User from './user/user.route';
import Group from './group/group.route';
import Type from './type/type.route';
import Util from './util/util.route';

const router: Router = Router();
router.use(Auth);
router.use(Wizard);
router.use(User);
router.use(Group);
router.use(Type);
router.use(Util);

export default router;
