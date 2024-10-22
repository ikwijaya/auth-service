import { IJwtVerify, IUserAccount } from "@/dto/common.dto";
import prisma from "./prisma";
import IORedis from 'ioredis';
import { convertToSeconds } from '@/utils/helper';
import logger from "./logger";

export class AuthValidate {
  private token: string
  private userAccount: IUserAccount | undefined;
  public expiresIn: string = '3m'
  private isActive: null | { id: number; userId: number } | string = null

  constructor(expiresIn: string = '3m', token: string) {
    this.expiresIn = expiresIn
    this.token = token
  }

  private connection: IORedis
  private connect() {
    this.connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT)
    })
  }

  /**
   *
   * @param id
   * @param formId
   * @param groupId
   */
  private async fetchDatabase(id: number, formId: undefined | string, groupId: number, username: string) {
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
          id: id,
        }
      })
      .catch((e) => {
        throw e;
      })

    const userGroup = await prisma.userGroup.findFirst({
      select: {
        typeId: true,
        type: {
          select: {
            name: true,
            flag: true,
            mode: true
          }
        },
        groupId: true,
        group: {
          select: {
            name: true,
          }
        },
      },
      where: {
        groupId: groupId,
        userId: id,
        recordStatus: 'A',
        actionCode: 'APPROVED'
      },
      orderBy: {
        checkedAt: 'desc'
      }
    }).catch(e => { throw e })

    if (!user) return { relogin: false } as IKickLogin;
    if (!userGroup) return { relogin: false } as IKickLogin;

    this.userAccount = {
      id: id,
      userId: user.id,
      token: this.token,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      ldapId: user.ldapId,
      typeId: userGroup.typeId,
      type: userGroup.type,
      groupId: groupId,
      group: userGroup.group
    }

    if (formId) this.userAccount.formId = Number(formId);
    await this.setRedis(username, JSON.stringify(this.userAccount)).catch(e => { throw e })
    return { relogin: false, payload: user } as IKickLogin;
  }

  /**
   *
   * @param username
   * @param value
   */
  private async setRedis(username: string, value: string | number | Buffer) {
    const seconds = convertToSeconds(this.expiresIn)
    await this.connection.set("uac_" + username, value);
    await this.connection.expire("uac_" + username, seconds);
  }

  /**
   *
   * @param key
   */
  private async getRedis(id: number, formId: undefined | string, groupId: number, username: string) {
    const value = await this.connection.get("uac_" + username);
    if (value) this.userAccount = JSON.parse(value);
  }

  /**
   *
   * @param key
   */
  private async sessionInRedis(username: string) {
    this.isActive = await this.connection.get("sid_" + username)

    logger.info('redis_token: ' + JSON.stringify(this.isActive))
    logger.info('ttl: ' + await this.connection.ttl("sid_" + username));
  }

  /**
   *
   * @param id
   * @param token
   */
  private async sessionInDatabase(id: number, token: string) {
    this.isActive = await prisma.session.findFirst({
      select: { id: true, userId: true },
      where: { recordStatus: 'A', token, userId: id },
    });
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
    try {
      if (!process.env.REDIS_HOST) {
        logger.info('read from database only')
        await this.sessionInDatabase(id, token).catch(e => { throw e })
        if (!this.isActive) return { relogin: true } as IKickLogin;

        return await this.fetchDatabase(id, formId, groupId, username).catch(e => { throw e })
      } else {
        logger.info('read from redis+database')
        this.connect()

        // checking in redis first
        await this.sessionInRedis(username).catch(e => { throw e })
        if (!this.isActive) return { relogin: true } as IKickLogin;

        // checking uac in redis
        await this.getRedis(id, formId, groupId, username).catch(e => { throw e })
        if (this.userAccount) {
          if (formId) this.userAccount.formId = Number(formId);

          return { relogin: false, payload: this.userAccount } as IKickLogin;
        } else return await this.fetchDatabase(id, formId, groupId, username).catch(e => { throw e })
      }
    } catch (error) {
      throw error
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

  const getUserGroup = await prisma.userGroup.findFirst({
    select: {
      typeId: true,
      type: {
        select: {
          name: true,
          flag: true,
          mode: true
        }
      },
      groupId: true,
      group: {
        select: {
          name: true,
        }
      },
    },
    where: {
      groupId: ijwt.groupId,
      userId: ijwt.id,
      recordStatus: 'A',
      actionCode: 'APPROVED'
    },
    orderBy: {
      checkedAt: 'desc'
    }
  }).catch(e => { throw e })

  return {
    ...ijwt,
    email: getUser?.email,
    privilegeName: getUserGroup?.type.name,
  } as IJwtVerify;
  }
}

export interface IKickLogin {
  relogin: boolean;
  payload?: IUserAccount;
}
