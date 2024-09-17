import { DEFAULT_PORT } from '@/utils/constants';

interface AppConfig {
  api: {
    /**
     * Api base path
     */
    basePath: string;

    /**
     * Api version
     */
    version: string;
  };
  docs: {
    /**
     * Swagger ui path
     */
    swaggerUIPath: string;

    /**
     * Open api specs path
     */
    apiDocsPath: string;
  };
  logs: {
    local:
      | {
          /**
           * Folder where log files would be saved
           */
          dir: string;

          /**
           * File name in which the combined logs of app would be written
           */
          logFile: string;

          /**
           * File name of error logs
           */
          errorLogFile: string;
        }
      | undefined;

    /**
     * true when you use the bucket
     */
    bucket:
      | {
          projectId?: string | undefined;
          prefix: string;
        }
      | undefined;
  };
  defaultPort: number;
  envFile: string;
}

const appConfig: AppConfig = {
  api: {
    basePath: 'api',
    version: 'v1',
  },
  docs: {
    swaggerUIPath: '/swagger',
    apiDocsPath: '/api-docs',
  },
  logs: {
    local: {
      dir: './logs',
      logFile: 'app.log',
      errorLogFile: 'error.log',
    },
    bucket: {
      // projectId: process.env.GOOGLE_PROJECT_ID,
      prefix: process.env.APP_NAME ?? 'gundala-petir',
    },
  },
  defaultPort: DEFAULT_PORT,
  envFile: '/deployments/config/application.env',
};

export default appConfig;
