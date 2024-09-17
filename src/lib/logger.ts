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

const { printf, combine, label, timestamp, json, prettyPrint } = format;
const logFormattter = printf(({ level, message, label, timestamp }) => {
  try {
    return `[${String(label)}] ${String(timestamp)} ${level}: ${String(
      message
    )}`;
  } catch (error) {
    return `[]`;
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
