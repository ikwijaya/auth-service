import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import logger from './logger';
import redisConnection from './ioredis';
import prisma from '@/lib/prisma';
import { type IAddQueue } from '@/dto/queue.dto';
import { type IUserAccount } from '@/dto/common.dto';
import { ROLE_USER } from '@/enums/role.enum';

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
   * @param typeId
   * @returns
   */
  private async sqlFindUserGroup(typeId: number[] = []) {
    return await prisma.$queryRaw<Array<{ id: number }>>`
      -- param {INT} $1:typeId(s)
      SELECT  a."id"
      FROM    "UserGroup" as a
      INNER JOIN (
        SELECT  MAX(b."checkedAt") as "maxdate", b."userId", b."groupId"
        FROM    "UserGroup" as b
        WHERE   b."actionCode" = 'APPROVED' AND b."recordStatus" = 'A'
        GROUP BY b."userId", b."groupId"
      ) as ib ON a."userId" = ib."userId" AND a."groupId" = ib."groupId" AND a."checkedAt" = ib."maxdate"
      WHERE   a."recordStatus" = 'A' AND a."actionCode" = 'APPROVED'
              AND a."typeId" IN (${Prisma.join(typeId)});
    `;
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
    const typeIds = type.map((e) => e.typeId);
    const findUserGroup: Array<{ id: number }> =
      await this.sqlFindUserGroup(typeIds);

    const userGroup = await prisma.userGroup
      .findMany({
        select: {
          userId: true,
          groupId: true,
          typeId: true,
          user: { select: { username: true, fullname: true, email: true } },
          group: { select: { name: true } },
          type: { select: { name: true, mode: true, flag: true } },
        },
        where: { groupId, id: { in: findUserGroup.map((e) => e.id) } },
      })
      .catch((e) => {
        throw e;
      });

    return userGroup;
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
    const findUserGroup: Array<{ id: number }> =
      await this.sqlFindUserGroup(typeIds);

    const userGroup = await prisma.userGroup
      .findMany({
        select: {
          userId: true,
          groupId: true,
          typeId: true,
          user: { select: { username: true, fullname: true, email: true } },
          group: { select: { name: true } },
          type: { select: { name: true, mode: true, flag: true } },
        },
        where: { id: { in: findUserGroup.map((e) => e.id) } },
      })
      .catch((e) => {
        throw e;
      });

    return userGroup;
  }

  /**
   *
   * @param data
   */
  public async addLog(data: IAddQueue[]) {
    if (!process.env.REDIS_HOST) return logger.warn(`<no-redis-defined>`);

    const now = Date.now();
    const queue = new Queue('AppLog', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
    data.forEach(
      async (e) => await queue.add(`log-${e.flag}-${now}`, e.payload)
    );
    queue.on('error', (err) =>
      logger.warn(`${Service.name} addLog: ${err.message}`)
    );
  }

  /**
   *
   * @param data
   */
  public async addNotif(data: IAddQueue[]) {
    if (!process.env.REDIS_HOST) return logger.warn(`<no-redis-defined>`);

    const now = Date.now();
    const queue = new Queue('AppNotif', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
    data.forEach(
      async (e) => await queue.add(`not-${e.flag}-${now}`, e.payload)
    );
    queue.on('error', (err) =>
      logger.warn(`${Service.name} addNotif: ${err.message}`)
    );
  }

  /**
   *
   * @param key
   * @param value
   * @param seconds num of expires in second
   * @returns
   */
  public async setRedisKV(
    key: string,
    value: string | number | Buffer,
    seconds: number
  ) {
    if (!process.env.REDIS_HOST) return logger.warn(`<no-redis-defined>`);
    await redisConnection.set(key, value);
    await redisConnection.expire(key, seconds);
  }

  /**
   *
   * @param key
   */
  public async getRedisK(key: string) {
    if (!process.env.REDIS_HOST) {
      logger.warn(`<no-redis-defined>`);
      return null;
    }
    const value = await redisConnection.get(key);
    return value;
  }

  /**
   *
   * @param key
   * @returns
   */
  public async delRedisK(key: string) {
    if (!process.env.REDIS_HOST) {
      logger.warn(`<no-redis-defined>`);
      return null;
    }

    const value = await redisConnection.get(key);
    if (!value) return null;
    await redisConnection.del(key);
  }

  /**
   *
   * @param userPrefix
   * @returns
   */
  public async delRedisUserKeys(userPrefix: string) {
    if (!process.env.REDIS_HOST) {
      logger.warn(`<no-redis-defined>`);
      return null;
    }

    // Create a pattern for the keys you want to delete (e.g., sid_user1_* for user1)
    const pattern = `${userPrefix}_*`;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisConnection.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await Promise.all(
          keys.map(async (key) => await redisConnection.del(key))
        );
      }
    } while (cursor !== '0');

    return null;
  }

  /**
   * superadmin is user which is type mode is SUPERADMIN
   * @param auth
   */
  public isSuperadmin(auth: IUserAccount) {
    return auth.type?.mode === ROLE_USER.SUPERADMIN;
  }
}

export default Service;
