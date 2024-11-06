import { Router } from 'express';
import Controller from './notif.controller';
import RequestValidator from '@/middlewares/request-validator';
import { verifyAccount } from '@/middlewares/auth';
import { PushNotifDto } from '@/dto/push-notif.dto';

const router: Router = Router();
const controller = new Controller();

router.post(
  '/notif',
  verifyAccount,
  RequestValidator.validate(PushNotifDto),
  controller.push
);
