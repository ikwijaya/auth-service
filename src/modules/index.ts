import { Router } from 'express';
import Auth from './auth/auth.route';
import Wizard from './wizard/wizard.route';
import Security from './security/security.route';
import Group from './group/group.route';
import Type from './type/type.route';
import Util from './util/util.route';
import DualControl from './dual-control/dual-control.route';
import Impersonate from './impersonate/impersonate.route';
import Log from './log/log.route';
import User from './user/user.route';
import UserGroup from './user-group/user-group.route';

const router: Router = Router();
router.use(Auth);
router.use(Wizard);
router.use(Security);
router.use(Group);
router.use(Type);
router.use(Util);
router.use(DualControl);
router.use(Impersonate);
router.use(Log);
router.use(User);
router.use(UserGroup);

export default router;
