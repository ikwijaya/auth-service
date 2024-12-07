import { Router } from 'express';
import Controller from './bull.controller';

const router: Router = Router();
const controller = new Controller();

router.post('/bull/login', controller.login);

export default router;
