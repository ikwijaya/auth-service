import {
  type IJwtVerify,
  type IUserAccount,
  type IUserMatrix,
} from '@/dto/common.dto';
import { type Environments } from '@/enums/environment.enum';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: Environments;
      PORT: string;

      APP_NAME: string;
      APP_BASE_URL: string;
      API_BASE_URL: string;
      AXIOS_TIMEOUT: string;

      ENCRYPTION_HASH: string;
      JWT_EXPIRE: string;
      JWT_SECRET: string;
      API_KEY: string;

      GOOGLE_PROJECT_ID: string;
      GOOGLE_LOG_BUCKET: string;

      OPTIMIZE_API_KEY: string;
      DATABASE_URL: string;
      NUM_PROXY: string;

      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_USERNAME: string;
      REDIS_PASSWORD: string;
      REDIS_SID_TTL: string;

      Q_LOG: string;
      Q_NOTIF: string;
      Q_SCHEDULER: string;
      Q_FILE_SERVICE: string;
      Q_MARKETPLACE: string;
      Q_KNOWLEDGE: string;

      API_GATEWAY: string;
    }
  }
}

declare global {
  // @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userMatrix: IUserMatrix;
      userAccount: IUserAccount;
      jwtToken: string;
      jwtVerify: IJwtVerify;
    }
  }
}

export {};
