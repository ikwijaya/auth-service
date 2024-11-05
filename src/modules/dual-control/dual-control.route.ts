import { Router } from 'express';
import Controller from './dual-control.controller';
import { verifyAccount } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';
import { EmailResponderDto } from '@/dto/checker.dto';
import MatrixValidator from '@/middlewares/matrix-validator';
import { ROLE_ACTION } from '@/enums/role.enum';

const router: Router = Router();
const controller = new Controller();

router.get(
  '/dual-control/checker/:page_id',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  controller.findChecker
);

router.post(
  '/dual-control/email-responder',
  verifyAccount,
  MatrixValidator.validate(ROLE_ACTION.read),
  RequestValidator.validate(EmailResponderDto),
  controller.findEmailResponder
);

export default router;
