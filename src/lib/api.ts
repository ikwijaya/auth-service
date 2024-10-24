import { HttpStatusCode } from 'axios';
import { type Request, type Response } from 'express';
import mcache from 'memory-cache';
import environment from './environment';
import logger from './logger';
import { Queue, QueueEvents } from 'bullmq'
import IORedis from 'ioredis';

export interface IWorkerApi {
  method: string,
  path: string;
  body: unknown;
  headers: {}
}

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
   * @param queueName
   * @param payload
   */
  public async sendQueueEvents<T>(
    res: Response,
    username: string,
    queueName: string,
    payload: IWorkerApi
  ) {
    const connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      maxRetriesPerRequest: null
    });

    const now: number = Date.now()
    const jobId: string = username + '_' + now;
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

    logger.info("create Queue" + queueName + " with jobId: " + jobId)
    const queueEvents = new QueueEvents(queueName, { connection, autorun: true })
    queue.add(jobId, payload, { jobId });
    queueEvents.on('progress', (args) => logger.info("JobId: " + args.jobId + " progressing"))
    queueEvents.on('completed', async (value) => {
      logger.info("jobId: " + value.jobId)
      logger.info("returnvalue: " + JSON.stringify(value.returnvalue))
      if (value.jobId === jobId) return res.json(value.returnvalue);
    });
  }
}

export default Api;
