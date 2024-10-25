import chalk from 'chalk';
import { EnvironmentFile } from '../enums/environment.enum';
import { type CommonEnvKeys } from '@/types/environment.type';
import logger from '@/lib/logger';
import IORedis from 'ioredis';

export type ChalkColor = typeof chalk.Color;

export const HR = (
  color: ChalkColor = 'white',
  char: string = '-',
  length: number = 60
): string => {
  return chalk[color](char.repeat(length));
};

const envScriptChalk = (fileName: string) => {
  const scriptChalk = chalk.bgBlueBright.bold;
  return `${scriptChalk(` cp .env.example ${fileName} `)}`;
};

export const envFileNotFoundError = (key: CommonEnvKeys): string => {
  const divider = HR('red', '~', 40);
  const envFile = EnvironmentFile[key];
  const defaultEnvFile = EnvironmentFile.DEFAULT;
  const envNotFoundMessage = chalk.red.bold('Environment file not found!!');
  const fileNotFoundMessage = `${chalk.greenBright(
    defaultEnvFile
  )} or ${chalk.greenBright(envFile)} is required`;
  return `
    \r${divider}\n
    \r${envNotFoundMessage}\n
    \r${divider}\n
    \r${fileNotFoundMessage}\n
    \r${chalk.bold('Try one of the following')}:\n
    \r${envScriptChalk(envFile)}\n
    \r${envScriptChalk(defaultEnvFile)}\n
    \r${divider}
  `;
};

/**
 *
 * @param key
 * @param value
 * @param seconds
 * @returns
 */
export const setRedisKV = async (key: string, value: string | number | Buffer, seconds: number) => {
  if (!process.env.REDIS_HOST) return logger.warn(`<no-redis-defined>`)

  const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  })

  await connection.set(key, value);
  await connection.expire(key, seconds);
}

/**
   *
   * @param key
   */
export const getRedisK = async (key: string) => {
  if (!process.env.REDIS_HOST) {
    logger.warn(`<no-redis-defined>`)
    return null
  }

  const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  })

  const value = await connection.get(key)
  return value
}

/**
 *
 * @param key
 * @returns
 */
export const delRedisK = async (key: string) => {
  if (!process.env.REDIS_HOST) {
    logger.warn(`<no-redis-defined>`)
    return null
  }

  const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  })

  const value = await connection.get(key)
  if (!value) return null
  await connection.del(key);
}

/**
 *
 * @param expiryValue
 * @returns
 */
export function convertToSeconds(expiryValue: string): number {
  // Define conversion factors
  const conversionFactors: { [key: string]: number } = {
    'd': 86400,  // 1 day = 86400 seconds
    'h': 3600,   // 1 hour = 3600 seconds
    'm': 60,     // 1 minute = 60 seconds
    's': 1       // 1 second = 1 second
  };

  // Initialize total seconds
  let totalSeconds = 0;

  // Split the input string by commas and process each part
  const parts = expiryValue.split(',');
  for (const part of parts) {
    const trimmedPart = part.trim();
    const unit = trimmedPart.charAt(trimmedPart.length - 1);
    const value = parseInt(trimmedPart.slice(0, -1), 10);

    // Check if the unit is valid and accumulate total seconds
    if (conversionFactors[unit]) {
      totalSeconds += value * conversionFactors[unit];
    }
  }

  return totalSeconds;
}
