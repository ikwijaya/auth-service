import { str, num, json } from 'envalid';
import appConfig from './app.config';
import { Environments } from '@/enums/environment.enum';

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

  GOOGLE_PROJECT_ID: str(),
  GOOGLE_LOG_BUCKET: str(),

  DATABASE_URL: str(),
  NUM_PROXY: num(),

  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_USERNAME: str(),
  REDIS_PASSWORD: str(),
  REDIS_SID_TTL: str(),
  REDIS_CERT: str(),

  Q_LOG: str(),
  Q_NOTIF: str(),
  Q_SCHEDULER: str(),
  Q_FILE_SERVICE: str(),
  Q_MARKETPLACE: str(),
  Q_KNOWLEDGE: str(),

  API_GATEWAY: json({ desc: 'defined for proxy gateway' }),
};

export default envValidationConfig;
