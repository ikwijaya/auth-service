import { ILogQMes, INotifQMes } from '@/dto/queue.dto';
import logger from './logger';
import prisma from '@/lib/prisma';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Prisma } from '@prisma/client';

/**
 * `Api` Represents an abstract base class for common expressJS API operations.
 *  Inherit this class to use the helper functions.
 */
abstract class Service {
  /**
   *
   * @param value
   * @returns
   */
  public notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }

  /**
   *
   * @param fid
   * @param groupId
   * @returns
   */
  public async findChecker(fid: number, groupId: number) {
    const type = await prisma.access
      .findMany({
        where: { formId: fid, roleAction: 'R', roleValue: true },
        select: { typeId: true },
      })
      .catch((e) => {
        throw e;
      });

    /**
     * handle when user status is waiting for approval
     * thats means this user has assign to some group before
     * and this user has waiting for new group after
     */
    const findUserGroup: { id: number }[] = await prisma.$queryRaw`
      SELECT  a."id"
      FROM    "UserGroup" as a
      INNER JOIN (
        SELECT  MAX(b."checkedAt") as "maxdate", b."userId", b."groupId"
        FROM    "UserGroup" as b
        WHERE   b."actionCode" = 'APPROVED' AND b."recordStatus" = 'A'
        GROUP BY b."userId", b."groupId"
      ) as ib ON a."userId" = b."userId" AND a."groupId" = b."groupId" AND a."checkedAt" = b."maxdate"
      WHERE   a."typeId" IN (${Prisma.join(type.map(e => e.typeId).filter(this.notEmpty))}) 
              AND a."recordStatus" = 'A' AND a."actionCode" = 'APPROVED';
    `

    const userGroup = await prisma.userGroup.findMany({
      select: {
        userId: true,
        groupId: true,
        typeId: true,
        user: { select: { username: true, fullname: true, email: true } },
        group: { select: { name: true } },
        type: { select: { name: true, mode: true, flag: true } },
      },
      where: { groupId, id: { in: findUserGroup.map(e => e.id) } }
    }).catch(e => { throw e })

    return userGroup
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
   * @param formIds number[]
   * @returns
   */
  public async findEmailResponder(formIds: number[]) {
    /**
     * get user when has approved
     */
    const access = await prisma.access
      .findMany({
        select: {
          formId: true,
          typeId: true,
          type: { select: { name: true } },
        },
        where: { roleAction: 'R', roleValue: true, formId: { in: formIds } },
      })
      .catch((e) => {
        throw e;
      });

    const typeIds: number[] = [...new Set(access.map((e) => e.typeId))];
    /**
     * handle when user status is waiting for approval
     * thats means this user has assign to some group before
     * and this user has waiting for new group after
     */
    const findUserGroup: { id: number }[] = await prisma.$queryRaw`
      SELECT  a."id"
      FROM    "UserGroup" as a
      INNER JOIN (
        SELECT  MAX(b."checkedAt") as "maxdate", b."userId", b."groupId"
        FROM    "UserGroup" as b
        WHERE   b."actionCode" = 'APPROVED' AND b."recordStatus" = 'A'
        GROUP BY b."userId", b."groupId"
      ) as ib ON a."userId" = b."userId" AND a."groupId" = b."groupId" AND a."checkedAt" = b."maxdate"
      WHERE   a."typeId" IN (${Prisma.join(typeIds)}) 
              AND a."recordStatus" = 'A' AND a."actionCode" = 'APPROVED';
    `

    const userGroup = await prisma.userGroup.findMany({
      select: {
        userId: true,
        groupId: true,
        typeId: true,
        user: { select: { username: true, fullname: true, email: true } },
        group: { select: { name: true } },
        type: { select: { name: true, mode: true, flag: true } },
      },
      where: { id: { in: findUserGroup.map(e => e.id) } }
    }).catch(e => { throw e })

    return userGroup
  }

  /**
   * 
   * @param data 
   */
  public async addLog(data: { flag: string, payload: ILogQMes }[]) {
    if (!process.env.REDIS_HOST) return logger.warn(`<no-redis-defined>`)

    const connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT)
    })

    const now = Date.now()
    const queue = new Queue('AppLog', {
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
    })
    data.forEach(e => queue.add(`log-${e.flag}-${now}`, e.payload));
    queue.on('error', (err) => logger.error(`${Service.name} addLog: ${err.message}`));
  }

  /**
   * 
   * @param data 
   */
  public async addNotif(data: { flag: string, payload: INotifQMes }[]) {
    if (!process.env.REDIS_HOST) return logger.warn(`<no-redis-defined>`)

    const connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT)
    })

    const now = Date.now()
    const queue = new Queue('AppNotif', {
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
    })
    data.forEach(e => queue.add(`not-${e.flag}-${now}`, e.payload));
    queue.on('error', (err) => logger.error(`${Service.name} addNotif: ${err.message}`));
  }
}

export default Service;
