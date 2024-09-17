import { str, num } from 'envalid';
import appConfig from './app.config';
import { Environments } from '@/enums/environment.enum';
import { MSG_BROKER_TYPE } from '@/enums/message-broker.enum';

const envValidationConfig = {
  NODE_ENV: str({
    default: Environments.DEV,
    choices: [...Object.values(Environments)],
  }),
  PORT: num({ default: appConfig.defaultPort }),

  APP_NAME: str({ default: 'application-name' }),
  APP_BASE_URL: str({ default: 'localhost' }),
  API_BASE_URL: str(),
  AXIOS_TIMEOUT: str({ default: '1000' }),

  ENCRYPTION_HASH: str(),
  JWT_EXPIRE: str(),
  JWT_SECRET: str(),
  API_KEY: str(),

  MSG_BROKER_TYPE: str({
    default: MSG_BROKER_TYPE.RMQ,
    choices: [...Object.values(MSG_BROKER_TYPE)],
  }),
  MSG_BROKER_URL: str(),
  TOPIC_NOTIFY: str(),
  TOPIC_LOGGY: str(),

  GOOGLE_PROJECT_ID: str(),
  GOOGLE_LOG_BUCKET: str(),

  DATABASE_URL: str(),
  NUM_PROXY: num(),
  UNREGISTER_PATH: str(),
};

export default envValidationConfig;
