import { HttpStatusCode } from 'axios';
import { type Request, type Response } from 'express';
import mcache from 'memory-cache';
import environment from './environment';
import logger from './logger';
import { Queue, QueueEvents } from 'bullmq'
import IORedis from 'ioredis';

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

  /**
   *
   * @param res
   * @param username
   * @param body
   * @param statusCode
   * @param queueName
   */
  public async sendQueueEvents<T>(
    res: Response,
    username: string,
    body: T,
    statusCode: number = HttpStatusCode.Ok,
    queueName: string
  ) {
    const connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      maxRetriesPerRequest: null
    });

    const queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    const queueEvents = new QueueEvents(queueName, { connection, autorun: true })
    const now: number = Date.now()
    const jobId: string = username + '_' + now;
    queue.add(jobId, body, { jobId });
    queueEvents.on('completed', async (value) => {
      logger.info("jobId: " + value.jobId)
      logger.info("returnvalue: " + JSON.stringify(value.returnvalue))
      if (value.jobId === jobId) return res.status(statusCode).json(value.returnvalue);
    });
  }
}

export default Api;
