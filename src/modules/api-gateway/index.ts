import { Router } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import { verifyAccount } from '@/middlewares/auth';
import logger from '@/lib/logger';
import APIGateway from '@/middlewares/api-gateway';

/**
 * @author: ikwijaya
 * @description:
 * module for APIGateway route,
 * which is proxy from this main host
 * to remote host.
 *
 * You must register in .env key API_GATEWAY or put the value is "{}"
 * don`t forget for JSON.stringify before put in .env
 * the types is Record<string, Options>
 *
 * @example:
 * export API_GATEWAY='{}'
 * or
 * export API_GATEWAY='{"/_log":{"target":"http://localhost:9000/v1","ws":false,"changeOrigin":true},"/_filemanager":{"target":"http://localhost:9000","ws":false,"changeOrigin":true},"/_config":{"target":"http://localhost:9000","ws":false,"changeOrigin":true},"/_filesharing":{"target":"http://localhost:9000","ws":false,"changeOrigin":true},"/_genai":{"target":"http://localhost:9000","ws":false,"changeOrigin":true}}'
 *
 * @type:
 * string is route, for reduce conflict route
 * Options is proxy middleware opts
 *
 * @example:
 * {
 *  '/_log': { target: 'http://localhost:9000/v1', ws: false, changeOrigin: true },
 *  '/_filemanager': { target: 'http://localhost:9000', ws: false, changeOrigin: true },
 *  '/_config': { target: 'http://localhost:9000', ws: false, changeOrigin: true },
 *  '/_filesharing': { target: 'http://localhost:9000', ws: false, changeOrigin: true },
 *  '/_genai': { target: 'http://localhost:9000', ws: false, changeOrigin: true }
 * }
 *
 */

const JsonGateway = process.env.API_GATEWAY;
const object: Record<string, Options> = JSON.parse(JsonGateway);
const router: Router = Router();

logger.warn('registered proxy: ');
console.log(object);

let i = 1;
for (const key in object) {
  if (Object.prototype.hasOwnProperty.call(object, key)) {
    logger.info((i++).toString() + '. proxy route: ' + key + ' is ready');
    const opts = object[key];
    router.use(
      key,
      verifyAccount,
      APIGateway.build(),
      createProxyMiddleware(opts)
    );
  }
}

export default router;
