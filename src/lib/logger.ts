import { existsSync, mkdirSync } from 'fs';
import {
  createLogger,
  format,
  type transport,
  type Logger,
  transports,
} from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import environment from './environment';
import { LOG_DATE_FORMAT } from '@/utils/constants';
import appConfig from '@/config/app.config';
import chalk from 'chalk';
import { Queue } from 'bullmq';
import { ILogQMes } from '@/dto/queue.dto';
import redisConnection from './ioredis';

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const logTransports: transport[] = [new transports.Console()];

if (!environment.isDev()) {
  /**
   * use local server or pods
   */
  if (appConfig.logs.local) {
    const {
      local: { dir: logDir, logFile, errorLogFile },
    } = appConfig.logs;

    if (!existsSync(logDir)) mkdirSync(logDir);
    const fileTransports: transport[] = [
      new transports.File({
        filename: `${logDir}/${errorLogFile}`,
        level: 'error',
      }),
      new transports.File({ filename: `${logDir}/${logFile}` }),
    ];

    logTransports.push(...fileTransports);
  }

  /**
   * use bucket
   */
  if (appConfig.logs.bucket) {
    const gcpLogTransports = new LoggingWinston({
      projectId: GOOGLE_PROJECT_ID,
      prefix: appConfig.logs.bucket.prefix,
    });

    logTransports.push(gcpLogTransports);
  }
}

/**
 *
 * save in redis-log
 * when level is not info
 * @param level
 * @param message
 * @returns
 */
const addSysLog = (level: string, message: any) => {
  if (level === 'error' && process.env.REDIS_HOST) {
    const value: ILogQMes = {
      serviceName: process.env.APP_NAME,
      action: `${level}`,
      json: {},
      message: message
    }

    const now = Date.now()
    const queue = new Queue('syslog', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    })

    queue.add(`syslog-${now}`, value)
    queue.on('error', (err) => logger.warn(`Logger: ${err.message}`));
  }
}

const { printf, combine, label, timestamp, json, prettyPrint } = format;
const logFormattter = printf(({ level, message, label, timestamp }) => {
  try {
    addSysLog(level, message);

    // print in cli
    const labelPrint = environment.isProd() ? chalk.bgYellow : chalk.green.bold;
    const levelPrint = ['error', 'err'].includes(level) ? chalk.red.bold :
      ['warn', 'warning'].includes(level) ? chalk.yellow.italic
        : chalk.italic.grey;
    return `[${labelPrint(String(label).toUpperCase())}] ${String(timestamp)} ${levelPrint(level)}: ${String(
      message
    )}`;
  } catch (error) {
    return chalk.bgGrey.italic(`<not-defined>`);
  }
});

let logger: Logger;
try {
  logger = createLogger({
    format: combine(
      label({ label: environment.env }),
      timestamp({ format: LOG_DATE_FORMAT }),
      json(),
      prettyPrint({ colorize: true }),
      logFormattter
    ),
    transports: logTransports,
  });
} catch (error) {
  console.error(`Error creating logger: ${error}`);
  logger = createLogger({}); // default logger
}

export default logger;
