import { HttpStatusCode } from 'axios';
import { type Request, type Response } from 'express';
import mcache from 'memory-cache';
import environment from './environment';
import logger from './logger';

/**
 * `Api` Represents an abstract base class for common expressJS API operations.
 *  Inherit this class to use the helper functions.
 */
abstract class Api {
  /**
   * Sends a JSON response to the client with the given data.
   *
   * @template T - The type of the data to be sent in the response.
   * @param res - The express response object.
   * @param data - The data to be sent in the response.
   * @param statusCode - The HTTP status code for the response.
   * @param message - The message accompanying the response.
   * @returns - The express response object with the provided data and status code.
   */
  public send<T>(
    res: Response,
    data: T,
    statusCode: number = HttpStatusCode.Ok,
    req?: Request,
    cache?: boolean,
    duration: number = 30
  ) {
    if (environment.isDev()) {
      logger.info(JSON.stringify(data, null, 2));
    }

    if (cache) {
      const path = req?.path;
      const key: string = `${path}_${JSON.stringify(req?.body)}`;
      mcache.put(key, data, 1000 * duration, (k, v) =>
        logger.info('put cache for key: ' + key)
      );
    }

    return res.status(statusCode).json(data);
  }

  /**
   *
   * @param ms
   * @returns
   */
  public async wait<T>(ms: number, value: T) {
    return await new Promise<T>((resolve) => setTimeout(resolve, ms, value));
  }
}

export default Api;
