import * as path from 'path';
import nocache from 'nocache';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import cors from 'cors';
import chalk from 'chalk';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { type BaseAdapter } from '@bull-board/api/dist/src/queueAdapters/base';
import home from './home';
import metrics from './metrics';
import expressJSDocSwaggerConfig from './config/express-jsdoc-swagger.config';
import appConfig from './config/app.config';
import { printAppInfo } from './utils/print-app-info';
import redisConnection from './lib/ioredis';
import errorHandler from '@/middlewares/error-handler';
import routes from '@/modules/index';
import prismaClient from '@/lib/prisma';
import environment from '@/lib/environment';

const chalkInit = chalk.yellow;
const initText = chalkInit(`RUNNING IN <${environment.env}> MODE`);
const numberOfProxy = process.env.NUM_PROXY;
class App {
  public express: express.Application;
  private readonly ioredis: IORedis;

  constructor() {
    this.ioredis = redisConnection;

    this.express = express();
    this.express.set('trust proxy', numberOfProxy);
    this.express.set('views', path.join(__dirname, '../public'));
    this.express.set('view engine', 'ejs');
    this.express.disable('x-powered-by');

    console.log(initText);
    if (environment.isDev()) this.express.use(cors());
    this.setMiddlewares();
    this.setRoutes();
    this.setErrorHandler();
    this.initializeDocs();
    this.bullMonitor();

    const port: number = parseInt(process.env.PORT);
    printAppInfo(
      port,
      environment.env,
      process.env.APP_BASE_URL,
      process.env.API_BASE_URL
    );
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
    const adapter = new ExpressAdapter();
    const createQueue = (name: string) =>
      new Queue(name, { connection: this.ioredis });
    this.express.use('/monitoring/login', async (req, res) => {
      await this.ioredis.del('_mon_');
      res.render('login');
    });

    this.express.use('/not-found', async (req, res) => {
      res.render('404');
    });
    this.express.use(
      '/monitoring',
      async (req, res, next) => {
        const value = await this.ioredis.get('_mon_');
        const role = await this.ioredis.get('_mon_role');
        const Q: BaseAdapter[] = Object.keys(process.env)
          .filter(
            (key) =>
              key.startsWith('Q_') &&
              process.env[key] !== undefined &&
              process.env[key] !== null
          )
          .map((key) => process.env[key] as string)
          .map(
            (e) =>
              new BullMQAdapter(createQueue(e), {
                readOnlyMode: role !== 'rw',
              })
          );

        adapter.setBasePath('/monitoring');
        createBullBoard({
          queues: Q,
          serverAdapter: adapter,
          options: {
            uiConfig: {
              boardTitle: 'Monitoring',
            },
          },
        });
        if (value) next();
        else res.redirect('/monitoring/login');
      },
      adapter.getRouter()
    );
  }
}

export default App;
