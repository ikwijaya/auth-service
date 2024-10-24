import nocache from 'nocache';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import cors from 'cors';
import home from './home';
import metrics from './metrics';
import expressJSDocSwaggerConfig from './config/express-jsdoc-swagger.config';
import appConfig from './config/app.config';
import errorHandler from '@/middlewares/error-handler';
import routes from '@/modules/index';
import prismaClient from '@/lib/prisma';
import environment from '@/lib/environment';
import chalk from 'chalk';
import { printAppInfo } from './utils/print-app-info';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const chalkInit = chalk.yellow
const initText = chalkInit(`RUNNING IN <${environment.env}> MODE`)
const numberOfProxy = process.env.NUM_PROXY;
class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.express.set('trust proxy', numberOfProxy);
    this.express.disable('x-powered-by');

    console.log(initText)
    if (environment.isDev()) this.express.use(cors());
    this.setMiddlewares();
    this.setRoutes();
    this.setErrorHandler();
    this.initializeDocs();
    this.bullMonitor();

    const port: number = parseInt(process.env.PORT)
    printAppInfo(port, environment.env, process.env.APP_BASE_URL, process.env.API_BASE_URL);
  }

  private setMiddlewares(): void {
    this.express.use(morgan('dev'));
    this.express.use(nocache());
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(helmet());
    this.express.use(express.static('public'));
  }

  private setRoutes(): void {
    const {
      api: { version },
    } = appConfig;
    this.express.use('/', home);
    this.express.use('/metrics', metrics);
    this.express.use(`/${version}` as string & { _kind?: 'MyString' }, routes);
  }

  private setErrorHandler(): void {
    this.express.use(errorHandler);
  }

  private initializeDocs(): void {
    expressJSDocSwagger(this.express)(expressJSDocSwaggerConfig);
  }

  public async connectPrisma(): Promise<void> {
    await prismaClient.$connect();
  }

  private async bullMonitor(): Promise<void> {
    if (!process.env.REDIS_HOST) undefined
    const connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      maxRetriesPerRequest: null
    });
    const createQueue = (name: string) => new Queue(name, { connection });
    const adapter = new ExpressAdapter()
    adapter.setBasePath('/monitoring');
    createBullBoard({
      queues: [
        new BullMQAdapter(createQueue(process.env.LOG_SERVICE_NAME), { readOnlyMode: true }),
        new BullMQAdapter(createQueue(process.env.NOTIF_SERVICE_NAME), { readOnlyMode: true }),
        new BullMQAdapter(createQueue(process.env.FILE_SERVICE_NAME), { readOnlyMode: true }),
        new BullMQAdapter(createQueue(process.env.MARKETPLACE_SERVICE_NAME), { readOnlyMode: true }),
        new BullMQAdapter(createQueue(process.env.KNOWLEDGE_SERVICE_NAME), { readOnlyMode: true }),
        new BullMQAdapter(createQueue(process.env.SCHEDULER_SERVICE_NAME), { readOnlyMode: true }),
      ], serverAdapter: adapter,
      options: {
        uiConfig: {
          boardTitle: 'Monitoring'
        }
      }
    })
    this.express.use('/monitoring', adapter.getRouter())
  }
}

export default App;
