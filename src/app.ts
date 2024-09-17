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
import { verifyApiKey, verifyTimestamp } from './middlewares/default';

const numberOfProxy = process.env.NUM_PROXY;
class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.express.set('trust proxy', numberOfProxy);
    this.express.disable('x-powered-by');

    if (environment.isDev()) console.log(`development: `, environment.isDev());
    if (environment.isDev()) this.express.use(cors());
    this.setMiddlewares();
    this.setRoutes();
    this.setErrorHandler();
    this.initializeDocs();
  }

  private setMiddlewares(): void {
    this.express.use(morgan('dev'));
    this.express.use(nocache());
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(helmet());
    this.express.use(verifyTimestamp);
    this.express.use(verifyApiKey);
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
}

export default App;
