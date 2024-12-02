// Based on: https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a
// Added TypeScript support and changed deprecated functions (e.g. btoa in Node.js)
import crypto from 'crypto';
import exRateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { HttpStatusCode } from 'axios';
import { type IApiError } from './errors';
import redisConnection from './ioredis';

/**
 * Encrypts plaintext using AES-CBC with supplied password, for decryption with aesCbcDecrypt().
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} plaintext - Plaintext to be encrypted.
 * @param   {String} password - Password to use to encrypt plaintext.
 * @returns {String} Encrypted ciphertext.
 *
 * @example
 *   const ciphertext = await aesCbcEncrypt('my secret text', 'pw');
 *   aesCbcEncrypt('my secret text', 'pw').then(function(ciphertext) { console.log(ciphertext); });
 */
export async function aesCbcEncrypt(
  plaintext: string,
  password: string | undefined
): Promise<string> {
  if (!password) throw new Error('Please set secret before execute');
  const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); // hash the password

  const iv = crypto.getRandomValues(new Uint8Array(16)); // get 128-bit random iv
  const alg = { name: 'AES-CBC', iv }; // specify algorithm to use

  const key = await crypto.subtle.importKey('raw', pwHash, alg, false, [
    'encrypt',
  ]); // generate key from pw

  const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
  const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

  const ctStr = Buffer.from(ctBuffer).toString('base64'); // ciphertext as base64 string
  const ivStr = Buffer.from(iv).toString('base64'); // iv as base64 string

  return `${ivStr}.${ctStr}`;
}

/**
 * Decrypts ciphertext encrypted with aesCbcEncrypt() using supplied password.
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} ciphertext - Ciphertext to be decrypted.
 * @param   {String} password - Password to use to decrypt ciphertext.
 * @returns {String} Decrypted plaintext.
 *
 * @example
 *   const plaintext = await aesCbcDecrypt(ciphertext, 'pw');
 *   aesCbcDecrypt(ciphertext, 'pw').then(function(plaintext) { console.log(plaintext); });
 */
export async function aesCbcDecrypt(
  ciphertext: string,
  password: string | undefined
): Promise<string> {
  try {
    if (!password) throw new Error('Please set secret before execute');
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8).catch((e) => {
      throw e;
    }); // hash the password

    if (!ciphertext.includes('.')) {
      throw new Error('Invalid ciphertext');
    }
    const cipherSplitted = ciphertext.split('.');
    const ivStr = cipherSplitted[0]; // decode base64 iv
    const iv = Buffer.from(ivStr, 'base64'); // iv as Uint8Array
    const alg = { name: 'AES-CBC', iv }; // specify algorithm to use
    const key = await crypto.subtle
      .importKey('raw', pwHash, alg, false, ['decrypt'])
      .catch((e) => {
        throw e;
      }); // generate key from pw

    const ctStr = cipherSplitted[1]; // decode base64 iv
    const ctUint8 = Buffer.from(ctStr, 'base64'); // ciphertext as Uint8Array
    const plainBuffer = await crypto.subtle
      .decrypt(alg, key, ctUint8)
      .catch((e) => {
        throw e;
      }); // decrypt ciphertext using key
    const plaintext = new TextDecoder().decode(plainBuffer); // plaintext from ArrayBuffer

    return plaintext; // return the plaintext
  } catch (e) {
    const _error: IApiError = {
      statusCode: HttpStatusCode.InternalServerError,
      name: 'Error',
      message: 'Internal Server Error',
    };

    throw _error;
  }
}

/**
 *
 * @param byteLength
 * @param alphabet
 * @returns
 */
export function generateRandomString(
  byteLength: number,
  alphabet: string = '0123456789abcdefghijklmnopqrstuvwxyz'
): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  let result = '';
  for (let i = 0; i < byteLength; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }

  return result;
}

interface IRateLimit {
  windowMs: number | undefined;
  limit: number | undefined;
  skip?: string[];
}
/**
 *
 * @param options
 * @returns
 */
export function rateLimit(options: IRateLimit) {
  if (process.env.REDIS_HOST)
    return exRateLimit({
      skip: (req, res) =>
        options.skip && req.ip ? options.skip.includes(req.ip) : false,
      windowMs: options.windowMs,
      limit: options.limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Terlalu banyak permintaan, silakan coba lagi nanti',
      },
      store: new RedisStore({
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: async (...args: string[]) =>
          // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
          await redisConnection.call(...args),
      }),
    });
  else
    return exRateLimit({
      skip: (req, res) =>
        options.skip && req.ip ? options.skip.includes(req.ip) : false,
      windowMs: options.windowMs,
      limit: options.limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Terlalu banyak permintaan, silakan coba lagi nanti',
      },
    });
}
