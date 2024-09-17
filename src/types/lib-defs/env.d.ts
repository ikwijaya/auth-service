import {
  type IJwtVerify,
  type IUserAccount,
  type IUserMatrix,
} from '@/dto/common.dto';
import { type Environments } from '@/enums/environment.enum';
import { type MSG_BROKER_TYPE } from '@/enums/message-broker.enum'

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

      MSG_BROKER_TYPE: MSG_BROKER_TYPE;
      MSG_BROKER_URL: string;
      TOPIC_NOTIFY: string;
      TOPIC_LOGGY: string;

      GOOGLE_PROJECT_ID: string;
      GOOGLE_LOG_BUCKET: string;

      DATABASE_URL: string;
      NUM_PROXY: string;
      UNREGISTER_PATH: string | undefined;
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
