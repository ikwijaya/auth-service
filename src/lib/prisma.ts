import { type Prisma, PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  transactionOptions: {
    timeout: 20_000,
    maxWait: 120_000,
  },
  errorFormat: 'pretty',
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

prisma.$on(`query`, async (e) => {
  loopQueryEvent(e);
});
prisma.$on(`info`, async (e) => {
  loopLogEvent(e, 'info');
});
prisma.$on(`error`, async (e) => {
  loopLogEvent(e, 'err');
});
prisma.$on(`warn`, async (e) => {
  loopLogEvent(e, 'warn');
});

/**
 *
 * @param object
 */
const loopQueryEvent = (object: Prisma.QueryEvent) => {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const element = object[key];
      logger.info(`[prisma-query]: ${key}: ${element}`);
    }
  }
};

/**
 *
 * @param object
 * @param status
 */
const loopLogEvent = (object: Prisma.LogEvent, status = 'log') => {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const element = object[key];
      logger.info(`[prisma-${status}]: ${key}: ${element}`);
    }
  }
};

export default prisma;
