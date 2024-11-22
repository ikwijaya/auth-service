import IORedis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();
const redisConnection: IORedis = new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err: Error) =>
  logger.warn('redisConnection: ' + err.message)
);
redisConnection.on('connect', () =>
  logger.info('redisConnection: OK ' + process.env.REDIS_HOST)
);
export default redisConnection;
