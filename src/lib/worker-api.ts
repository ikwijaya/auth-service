import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import axios from 'axios';
import { type IApiError } from './errors';
import logger from './logger';
import { type IMessages, type IWorkerApi } from '@/dto/common.dto';

const instance = axios.create({ baseURL: process.env.APP_BASE_URL });
export class WorkerApi {
  private readonly connection: IORedis;
  constructor(ioredis: IORedis) {
    logger.info(WorkerApi.name + ' is starting...');
    this.connection = ioredis;
  }

  /**
   *
   * @param [queueName='string']
   * @param [concurrency=10]
   */
  public runWorker(queueName: string) {
    const worker = new Worker<IWorkerApi, IMessages | IApiError>(
      queueName,
      async (job: Job) => {
        try {
          const workerApi: IWorkerApi = job.data;
          if (workerApi.method === 'GET')
            return await this.get(workerApi.path, workerApi.headers).catch(
              (e) => {
                throw e;
              }
            );
          if (workerApi.method === 'POST')
            return await this.post(
              workerApi.path,
              workerApi.body,
              workerApi.headers
            ).catch((e) => {
              throw e;
            });
          if (workerApi.method === 'PATCH')
            return await this.patch(
              workerApi.path,
              workerApi.body,
              workerApi.headers
            ).catch((e) => {
              throw e;
            });
          if (workerApi.method === 'PUT')
            return await this.put(
              workerApi.path,
              workerApi.body,
              workerApi.headers
            ).catch((e) => {
              throw e;
            });
          if (workerApi.method === 'DELETE')
            return await this.delete(workerApi.path, workerApi.headers).catch(
              (e) => {
                throw e;
              }
            );
          else throw { rawErrors: ['Not Implemented'] } as IApiError;
        } catch (error) {
          console.error('Job failed:', error?.response?.data); // Log the error
          return error?.response?.data;
        }
      },
      {
        connection: this.connection,
        useWorkerThreads: true,
        autorun: true,
      }
    );

    worker.concurrency = 100;
    worker.on('error', (err) => {
      console.log(WorkerApi.name, queueName, 'has error job: ', err.message);
    });
    worker.on('failed', (job: Job, err: Error) => {
      console.log(WorkerApi.name, queueName, 'has failed job: ', {
        reason: job.failedReason,
        name: job.name,
        id: job.id,
        data: job.data,
        errMessage: err.message,
      });
    });
    worker.on('progress', (job: Job, progress: number | object) => {
      console.log(WorkerApi.name, queueName, 'has progress job: ' + job.name);
    });
    worker.on('completed', (job: Job, result: any, prev: string) => {
      console.log(WorkerApi.name, queueName, 'has completed job: ' + job.name);
    });
  }

  /**
   *
   * @param path
   * @param headers
   */
  private async get(url: string, headers: {}) {
    return await instance
      .get(url, { headers })
      .then((res) => res.data)
      .catch((e) => {
        throw e;
      });
  }

  /**
   *
   * @param url
   * @param body
   * @param headers
   * @returns
   */
  private async post(url: string, body: unknown, headers: {}) {
    return await instance
      .post(url, body, { headers })
      .then((res) => res.data)
      .catch((e) => {
        throw e;
      });
  }

  /**
   *
   * @param url
   * @param body
   * @param headers
   * @returns
   */
  private async put(url: string, body: unknown, headers: {}) {
    return await instance
      .put(url, body, { headers })
      .then((res) => res.data)
      .catch((e) => {
        throw e;
      });
  }

  /**
   *
   * @param url
   * @param body
   * @param headers
   * @returns
   */
  private async patch(url: string, body: unknown, headers: {}) {
    return await instance
      .patch(url, body, { headers })
      .then((res) => res.data)
      .catch((e) => {
        throw e;
      });
  }

  /**
   *
   * @param url
   * @param body
   * @param headers
   * @returns
   */
  private async delete(url: string, headers: {}) {
    return await instance
      .delete(url, { headers })
      .then((res) => res.data)
      .catch((e) => {
        throw e;
      });
  }
}
