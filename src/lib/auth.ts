import type IORedis from 'ioredis';
import prisma from './prisma';
import logger from './logger';
import redisConnection from './ioredis';
import { type IJwtVerify, type IUserAccount } from '@/dto/common.dto';
import { convertToSeconds } from '@/utils/helper';

export class AuthValidate {
  private readonly token: string;
  private userAccount: IUserAccount | undefined;
  public expiresIn: string = '7m';

  constructor(expiresIn: string = '7m', token: string) {
    this.expiresIn = expiresIn;
    this.token = token;
  }

  private connection: IORedis;
  private connect() {
    this.connection = redisConnection;
  }

  /**
   *
   * @param id
   * @param formId
   * @param groupId
   */
  private async fetchDatabase(
    id: number,
    formId: undefined | string,
    groupId: number,
    username: string,
    fcmUrl?: string | null
  ) {
    const user = await prisma.user
      .findFirst({
        select: {
          id: true,
          username: true,
          email: true,
          fullname: true,
          ldapId: true,
        },
        where: {
          id,
        },
      })
      .catch((e) => {
        throw e;
      });

    const userGroup = await prisma.userGroup
      .findFirst({
        select: {
          typeId: true,
          type: {
            select: {
              name: true,
              flag: true,
              mode: true,
            },
          },
          groupId: true,
          group: {
            select: {
              name: true,
            },
          },
        },
        where: {
          groupId,
          userId: id,
          recordStatus: 'A',
          actionCode: 'APPROVED',
        },
        orderBy: {
          checkedAt: 'desc',
        },
      })
      .catch((e) => {
        throw e;
      });

    if (!user) return { relogin: false } satisfies IKickLogin;
    if (!userGroup) return { relogin: false } satisfies IKickLogin;

    this.userAccount = {
      id,
      userId: user.id,
      token: this.token,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      ldapId: user.ldapId,
      typeId: userGroup.typeId,
      type: userGroup.type,
      groupId,
      group: userGroup.group,
      fcmUrl,
    };

    if (formId) this.userAccount.formId = Number(formId);
    await this.setRedis(username, JSON.stringify(this.userAccount)).catch(
      (e) => {
        throw e;
      }
    );

    return { relogin: false, payload: this.userAccount } satisfies IKickLogin;
  }

  /**
   *
   * @param username
   * @param value
   */
  private async setRedis(username: string, value: string | number | Buffer) {
    const seconds = convertToSeconds(this.expiresIn);
    await this.connection.set('uac_' + username, value);
    await this.connection.expire('uac_' + username, seconds);
  }

  /**
   *
   * @param key
   */
  private async getRedis<T>(username: string) {
    const value = await this.connection.get('uac_' + username);
    if (value) this.userAccount = JSON.parse(value) satisfies T;
  }

  /**
   *
   * @param key
   */
  private async sessionInRedis(username: string) {
    const output = await this.connection.get('sid_' + username);
    const ttl: number = await this.connection.ttl('sid_' + username);

    logger.info('redis_token: ' + JSON.stringify(output));
    logger.info('ttl: ' + ttl.toString());

    return output;
  }

  /**
   *
   * @param id
   * @param token
   */
  private async sessionInDatabase(id: number, token: string) {
    const output = await prisma.session.findFirst({
      select: { id: true, userId: true, fcmUrl: true },
      where: { recordStatus: 'A', token, userId: id },
    });

    return output;
  }

  /**
   *
   * @param id
   * @param token
   * @param formId
   * @param groupId
   */
  public async validate(
    id: number,
    token: string,
    formId: undefined | string,
    groupId: number,
    username: string
  ) {
    if (!process.env.REDIS_HOST) {
      logger.info('read from database only');
      const session = await this.sessionInDatabase(id, token).catch((e) => {
        throw e;
      });
      if (!session)
        return { relogin: true, payload: undefined } satisfies IKickLogin;

      return await this.fetchDatabase(
        id,
        formId,
        groupId,
        username,
        session.fcmUrl
      ).catch((e) => {
        throw e;
      });
    } else {
      logger.info('read from redis+database');
      this.connect();

      // checking in redis first
      const session = await this.sessionInRedis(username).catch((e) => {
        throw e;
      });
      if (!session)
        return { relogin: true, payload: undefined } satisfies IKickLogin;

      // checking uac in redis
      await this.getRedis<IUserAccount>(username).catch((e) => {
        throw e;
      });
      if (this.userAccount) {
        if (formId) this.userAccount.formId = Number(formId);

        return {
          relogin: false,
          payload: this.userAccount,
        } satisfies IKickLogin;
      } else
        return await this.fetchDatabase(id, formId, groupId, username).catch(
          (e) => {
            throw e;
          }
        );
    }
  }

  /**
   *
   * @param ijwt
   * @returns
   */
  public async minValidate(ijwt: IJwtVerify) {
    const getUser = await prisma.user
      .findFirst({
        select: {
          email: true,
        },
        where: { id: ijwt.id },
      })
      .catch((e) => {
        throw e;
      });

    const getUserGroup = await prisma.userGroup
      .findFirst({
        select: {
          typeId: true,
          type: {
            select: {
              name: true,
              flag: true,
              mode: true,
            },
          },
          groupId: true,
          group: {
            select: {
              name: true,
            },
          },
        },
        where: {
          groupId: ijwt.groupId,
          userId: ijwt.id,
          recordStatus: 'A',
          actionCode: 'APPROVED',
        },
        orderBy: {
          checkedAt: 'desc',
        },
      })
      .catch((e) => {
        throw e;
      });

    return {
      ...ijwt,
      email: getUser?.email,
      privilegeName: getUserGroup?.type.name,
    } satisfies IJwtVerify;
  }
}

export interface IKickLogin {
  relogin: boolean;
  payload?: IUserAccount;
}
