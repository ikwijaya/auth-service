import { HttpStatusCode } from 'axios';
import { type Request, type Response } from 'express';
import mcache from 'memory-cache';
import environment from './environment';
import logger from './logger';
import { Queue, QueueEvents } from 'bullmq'
import { IWorkerApi } from '@/dto/common.dto';
import axios from 'axios';
import { IApiError } from './errors';
import redisConnection from './ioredis';

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
    const now: number = Date.now()
    const jobId: string = username + '_' + now;
    const queue = new Queue(queueName, {
      connection: redisConnection,
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
    const queueEvents = new QueueEvents(queueName, { connection: redisConnection, autorun: true })
    queue.add(jobId, payload, { jobId });
    queueEvents.on('error', (err: Error) => logger.warn(Api.name + ': ' + err.name))
    queueEvents.on('progress', (args) => logger.info("JobId: " + args.jobId + " progressing"))
    queueEvents.on('completed', async (value) => {
      logger.info("jobId: " + value.jobId)
      logger.info("returnvalue: " + JSON.stringify(value.returnvalue))
      if (value.jobId === jobId) {
        if (!value.returnvalue['statusCode']) return res.json(value.returnvalue);
        else res.status(value.returnvalue['statusCode']).send(value.returnvalue);
      }
    });
  }

  /**
   *
   * @param baseURL
   * @param payload
   * @returns
   */
  public async sendRestful<T>(
    baseURL: string,
    payload: IWorkerApi
  ) {
    const instance = axios.create({ baseURL })
    if (payload.method === 'GET') return await instance.get(payload.path, { headers: payload.headers as {} }).then((r) => r.data).catch(e => { throw e })
    else if (payload.method === 'POST') return await instance.post(payload.path, payload.body, { headers: payload.headers as {} }).then((r) => r.data).catch(e => { throw e })
    else if (payload.method === 'PUT') return await instance.put(payload.path, payload.body, { headers: payload.headers as {} }).then((r) => r.data).catch(e => { throw e })
    else if (payload.method === 'PATCH') return await instance.patch(payload.path, payload.body, { headers: payload.headers as {} }).then((r) => r.data).catch(e => { throw e })
    else if (payload.method === 'DELETE') return await instance.delete(payload.path, { headers: payload.headers as {} }).then((r) => r.data).catch(e => { throw e })
    else throw { rawErrors: ["Not Implemented"] } as IApiError
  }


}

export default Api;
