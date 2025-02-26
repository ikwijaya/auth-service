import server from './server';
import logger from './lib/logger';
import redisConnection from './lib/ioredis';
import prismaClient from '@/lib/prisma';

server.listen(process.env.PORT, () => {
  logger.info(
    `application 🐱‍👤 running in ${process.env.PORT}\n` as string & {
      _kind?: 'MyString';
    }
  );
});

process.on('SIGINT', () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  prismaClient.$disconnect();
  void redisConnection.quit();
  logger.warn('Prisma Disconnected.');
  logger.warn('Redis Disconnected.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.listen(process.env.PORT, () => {
    logger.info(
      `application 🐱‍👤 re-run by SIGTERM in ${process.env.PORT}\n` as string & {
        _kind?: 'MyString';
      }
    );
  });
});
