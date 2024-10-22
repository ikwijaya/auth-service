import { Router } from 'express';
import Controller from './auth.controller';
import { LoginDto } from '@/dto/auth.dto';
import RequestValidator from '@/middlewares/request-validator';
import { verifyAccount } from '@/middlewares/auth';
import { rateLimit } from '@/lib/security';

const windowMs = 5 * 60 * 1000; /// 15 minutes
const router: Router = Router();
const controller = new Controller();

/**
 * POST /v1/auth/login
 * @summary this is summary
 * @param {object} request.body.required - Login Info
 * @example request - login info
 * {
 *    "username": "your-username",
 *    "password": "password",
 *    "groupId": 1
 * }
 * @return {object} 200 - ok
 * @example response - 200 - ok
 * {
 *    "accessToken": "<string>",
 *    "expiresIn": "<string>",
 *    "groupId": "<number>"
 * }
 * @return {object} 400 - failed
 * @example response - 400 - failed
 * {
 *    "rawErrors": []
 * }
 */
router.post(
  '/auth/login',
  rateLimit({ windowMs, limit: 25 }),
  RequestValidator.validate(LoginDto),
  controller.login
);

/**
 * GET /v1/auth/groups/{username}
 * @summary api for call user groups
 * @param {string} id.path
 * @return {object} 200 - success response - application/json
 */
router.get(
  '/auth/groups/:username',
  rateLimit({ windowMs, limit: 25 }),
  controller.groups
);

/**
 * GET /v1/auth/logout
 * @security BasicAuth
 * @summary api for logout
 */
router.get('/auth/logout', verifyAccount, controller.logout);

export default router;
