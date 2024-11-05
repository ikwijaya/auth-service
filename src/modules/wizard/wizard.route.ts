import { Router } from 'express';
import Controller from './wizard.controller';
import { RunWizardDto, ExecWizardDto } from '@/dto/wizard.dto';
import RequestValidator from '@/middlewares/request-validator';
import { rateLimit } from '@/lib/security';

const windowMs = 3 * 60 * 1000; /// 3 minutes
const router: Router = Router();
const controller = new Controller();

router.post(
  '/wizard/run',
  RequestValidator.validate(RunWizardDto),
  controller.run
);
router.post(
  '/wizard/execute',
  rateLimit({ windowMs, limit: 5 }),
  RequestValidator.validate(ExecWizardDto),
  controller.execute
);
router.post(
  '/wizard/support',
  RequestValidator.validate(RunWizardDto),
  controller.support
);

export default router;
