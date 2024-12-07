import { Router } from 'express';
import Auth from './auth/auth.route';
import Wizard from './wizard/wizard.route';
import Security from './security/security.route';
import Group from './group/group.route';
import Type from './type/type.route';
import Util from './util/util.route';
import Impersonate from './impersonate/impersonate.route';
import BullMonitoring from './bull';
import User from './user/user.route';
import UserGroup from './user-group/user-group.route';
import Confuse from './confuse';
import ApiGateway from './api-gateway';

const router: Router = Router();
router.use(Auth);
router.use(Wizard);
router.use(Security);
router.use(Group);
router.use(Type);
router.use(Util);
router.use(Impersonate);
router.use(BullMonitoring);
router.use(User);
router.use(UserGroup);
router.use(Confuse);

/**
 * ApiGateway is registered for proxy url from host
 * [i think] this module must declared
 * after all registered route
 * for reduce confict in app-router
 */
router.use(ApiGateway);

export default router;
