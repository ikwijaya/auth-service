import fs from 'fs';
import path from 'path';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();
const redisCert = process.env.REDIS_CERT;
console.info('[🔥 srv:pwd] ' + path.resolve(__dirname));
console.info('[🔥 env:cert] ' + redisCert);
console.info(
  '[🔥 full-path] ' +
    path.resolve(__dirname, redisCert) +
    ' make sure your file is exists'
);

const redisConnection: IORedis = new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
  tls: {
    cert: fs.readFileSync(path.resolve(__dirname, redisCert)),
  },
});

redisConnection.on('error', (err: Error) =>
  logger.warn('redisConnection: ' + err.message)
);
redisConnection.on('connect', () =>
  logger.info('redisConnection: OK ' + process.env.REDIS_HOST)
);
export default redisConnection;
