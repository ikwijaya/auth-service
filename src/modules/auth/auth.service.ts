import { type Ldap } from '@prisma/client';
import { authenticate, type AuthenticationOptions } from 'ldap-authentication';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { type Entry, Client } from 'ldapts';
import prisma from '@/lib/prisma';
import { type IApiError } from '@/lib/errors';
import { type LoginResDto, type LoginDto } from '@/dto/auth.dto';
import { type IJwtVerify, type IMessages } from '@/dto/common.dto';
import { aesCbcDecrypt } from '@/lib/security';
import Service from '@/lib/service';
import {
  AUTH_FAIL_01,
  LOGIN_FAIL_00,
  LOGIN_FAIL_01,
  LOGOUT_ALREADY,
} from '@/utils/constants';
import environment from '@/lib/environment';
import logger from '@/lib/logger';
import { ILogQMes } from '@/dto/queue.dto';
const maxAttempt: number = 5;

interface ILdapAttr {
  dn?: string;
  cn?: string;
  mail?: string;
  displayName?: string;
}

export default class AuthService extends Service {

  /**
   * 
   * @param obj 
   * @param username 
   * @param password 
   * @param ldap 
   * @param attempt 
   */
  private async binding(
    obj: {
      userId: number;
      roleId: number;
      roleName: string,
      groupId?: number;
      groupName?: string,
      device?: string;
      ipAddress?: string;
    },
    username: string,
    password: string,
    ldap: Ldap,
    attempt: number
  ) {
    const verify = await this.verifyLdap(username, ldap)
    if (!verify.valid) throw { rawErrors: [AUTH_FAIL_01] } as IApiError;

    const userPassword: string = await aesCbcDecrypt(
      password,
      process.env.ENCRYPTION_HASH
    ).catch((e) => {
      throw e;
    });

    const dn = verify.entries.length > 0 ? verify.entries[0].dn : undefined;
    const options: AuthenticationOptions | undefined = {
      ldapOpts: { url: ldap.url },
      userDn: dn,
      userPassword,
      userSearchBase: this.buildDn(ldap),
      usernameAttribute: ldap.filter,
      username: username,
      attributes: ['dn', 'cn', 'mail', 'displayName'],
    };

    /**
     * in production this binding
     * harus bawa user admin as binder
     */
    const ldapPassword: string = ldap.usePlain ? ldap.password : await aesCbcDecrypt(ldap.password, process.env.ENCRYPTION_HASH).catch((e) => { throw e; });
    if (environment.isProd()) {
      options.adminDn = this.buildUserMaster(ldap.username, ldap);
      options.adminPassword = ldapPassword;
    }

    /**
     * handle ldap
     */
    const valid: ILdapAttr | null | undefined = await authenticate(
      options
    ).catch(async (e) => {
      /**
       * Jika salah {n} times, maka harus cek ldap
       * dan get bad count dan kapan bisa login
       */
      const nextLogin: string[] = [];
      if (attempt >= maxAttempt && ldap) {
        const lockoutTime = verify.valid && verify.entries.length > 0 ? verify.entries[0].lockoutTime : undefined;
        logger.warn(`${AuthService.name}: ${lockoutTime}`);
        if (lockoutTime) {
          const date: Date = this.adConvertTime(lockoutTime as string);
          logger.error(`login failed ${username}, please relogin after ${date}`);
          nextLogin.push(`Silakan coba kembali setelah beberapa menit`);
        }

        const payload: ILogQMes = {
          serviceName: AuthService.name,
          action: 'bad-login',
          json: { username: username, lockoutTime },
          message: `${username} failed login: (percobaan: ${attempt}x), kesalahan pada username atau password. lock-time: ${lockoutTime}`,
          createdAt: new Date(),
          createdBy: obj.userId,
          createdUsername: username,
          roleId: obj.roleId,
          roleName: obj.roleName,
          device: obj.device,
          ipAddress: obj.ipAddress
        }

        this.addLog([{ flag: `${AuthService.name}`, payload }])
        throw {
          stack: environment.isDev() ? verify : e,
          rawErrors: [
            `(percobaan: ${attempt}x), kesalahan pada username atau password`,
          ].concat(nextLogin),
        } as IApiError;
      }

      await prisma
        .$transaction([
          prisma.user.update({
            where: { id: obj.userId },
            data: {
              attempt: attempt + 1,
              updatedAt: new Date(),
              updatedBy: obj.userId,
            },
          })
        ])
        .catch((e) => {
          throw e;
        });

      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'bad-login',
        json: { username: username, groupId: obj.groupId, type: obj.roleName },
        message: `${username} failed login: (percobaan: ${attempt}x), kesalahan pada username atau password`,
        createdAt: new Date(),
        createdBy: obj.userId,
        createdUsername: username,
        roleId: obj.roleId,
        roleName: obj.roleName,
        device: obj.device,
        ipAddress: obj.ipAddress
      }

      this.addLog([{ flag: `${AuthService.name}`, payload }])
      throw {
        rawErrors: [`(percobaan: ${attempt + 1}x), kesalahan pada username atau password`],
        stack: e,
      } as IApiError;
    });

    if (valid) {
      logger.info(`nice binding for ${username} with DN: ${dn}`)
      return valid
    } else {
      await prisma
        .$transaction([
          prisma.user.update({
            where: { id: obj.userId },
            data: {
              attempt: attempt + 1,
              updatedAt: new Date(),
              updatedBy: obj.userId,
            },
          }),
        ])
        .catch((e) => {
          throw e;
        });

      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'bad-login',
        json: { username: username, groupId: obj.groupId },
        message: `${username} failed login`,
        createdAt: new Date(),
        createdBy: obj.userId,
        createdUsername: username,
        roleId: obj.roleId,
        roleName: obj.roleName,
        device: obj.device,
        ipAddress: obj.ipAddress
      }

      this.addLog([{ flag: `${AuthService.name}`, payload }])
      throw { rawErrors: [LOGIN_FAIL_01] } as IApiError;
    }
  }

  /**
   * 
   * @param obj
   * @returns 
   */
  private async findUser(obj: LoginDto) {
    const user = await prisma.user
      .findFirst({
        select: {
          ldap: true,
          id: true,
          username: true,
          fullname: true,
          email: true,
          attempt: true,
        },
        where: {
          username: obj.username.toLowerCase(),
          recordStatus: 'A',
        },
      })
      .catch((e) => {
        throw e;
      });

    if (user) return user
    else {
      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'bad-login',
        json: { username: obj.username, groupId: obj.groupId },
        message: `${obj.username} failed login`,
        createdAt: new Date(),
        device: obj.device,
        ipAddress: obj.ipAddress
      }

      this.addLog([{ flag: `${AuthService.name}`, payload }])
      throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;
    }
  }

  /**
   * 
   * @param obj 
   * @returns 
   */
  private async withoutGroup(obj: LoginDto) {
    const user = await this.findUser(obj);
    if (!user) throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;
    const countUserGroup = await prisma.userGroup
      .count({ where: { userId: user?.id } })
      .catch((e) => {
        throw e;
      });

    if (countUserGroup === 0) throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;
    const userGroup = await prisma.userGroup
      .findFirst({
        select: {
          groupId: true,
          group: { select: { name: true } },
          typeId: true,
          type: { select: { name: true, mode: true, flag: true } }
        },
        where: {
          userId: user.id,
          recordStatus: 'A',
          isDefault: true,
          actionCode: 'APPROVED'
        },
        orderBy: {
          checkedAt: 'desc'
        }
      })
      .catch(e => { throw e })
    if (!userGroup) throw { rawErrors: ["You not have default group to login, please select group before login"] } as IApiError;
    else return { user, userGroup }
  }

  /**
   * 
   * @param obj 
   */
  public async login(obj: LoginDto) {
    const { user, userGroup } = await this.withoutGroup(obj).catch(e => { throw e })

    if (!user.ldap) throw { rawErrors: ["Your account is not provided by active directory forest"] } as IApiError;
    const valid = await this.binding({
      userId: user.id,
      roleId: userGroup.typeId,
      roleName: userGroup.type.name,
      groupId: userGroup.groupId,
      groupName: userGroup.group.name,
    }, obj.username, obj.password, user.ldap, user.attempt);

    const token = Jwt.sign(
      {
        id: user.id,
        username: obj.username,
        fullname: user.fullname,
        groupId: userGroup.groupId,
        method: 'original',
        type: 'app-cms',
      } as IJwtVerify,
      process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
      { expiresIn: process.env.JWT_EXPIRE }
    );

    await prisma
      .$transaction(async (tx) => {
        await tx.user
          .update({
            where: { id: user.id },
            data: {
              fullname: valid.displayName,
              email: valid.mail,
              attempt: 0,
            },
          })
          .catch((e) => {
            throw e;
          });

        /**
         * for handle single session
         * only for production
         */
        if (environment.isProd()) {
          logger.info(`Multiple session is disable, cause env is ${environment.env}`);
          const lastSessions = await tx.session
            .findMany({ where: { userId: user.id, recordStatus: 'A' } })
            .catch((e) => {
              throw e;
            });
          await tx.session
            .updateMany({
              data: {
                recordStatus: 'N',
                updatedAt: new Date(),
                updatedBy: user.id,
              },
              where: {
                id: { in: lastSessions.map((e) => e.id) },
              },
            })
            .catch((e) => {
              throw e;
            });
        } else
          logger.info(`Multiple session is enable, cause env is ${environment.env}`);

        /**
         * handle create new session
         */
        await tx.session.create({
          data: {
            createdBy: user.id,
            createdAt: new Date(),
            token,
            type: 'app-cms',
            userId: user.id,
          },
        });

        const payload: ILogQMes = {
          serviceName: AuthService.name,
          action: 'login',
          json: { username: obj.username, groupId: obj.groupId, type: userGroup.type, fullname: user.fullname },
          message: `${obj.username} success login`,
          createdAt: new Date(),
          createdBy: user.id,
          createdUsername: user.username,
          roleId: userGroup.typeId,
          roleName: userGroup.type?.name,
          device: obj.device,
          ipAddress: obj.ipAddress
        }

        this.addLog([{ flag: `${AuthService.name}`, payload }])
      })
      .catch((e) => {
        throw e;
      });

    return {
      accessToken: token,
      expiresIn: process.env.JWT_EXPIRE,
      groupId: obj.groupId
    } as LoginResDto;
  }

  /**
   * 
   * @param username 
   */
  public async groups(username: string) {
    const user = await prisma.user
      .findFirst({
        select: {
          ldap: true,
          id: true,
          username: true,
          fullname: true,
          email: true,
          attempt: true,
        },
        where: {
          username: username.toLowerCase(),
          recordStatus: 'A',
        },
      })
      .catch((e) => {
        throw e;
      });

    if (!user) throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;
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
      WHERE   a."recordStatus" = 'A' AND a."actionCode" = 'APPROVED';
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
      where: { id: { in: findUserGroup.map(e => e.id) }, userId: user.id }
    }).catch(e => { throw e })

    const gIds = userGroup.map(e => e.groupId)
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      where: {
        id: { in: gIds }
      }
    }).catch(e => { throw e })

    return { messages: [], payload: { groups: Array.from(new Set(groups)) } } as IMessages
  }

  /**
   *
   * @param token
   */
  public async logout(token: string): Promise<IApiError | IMessages> {
    const user = await prisma.session
      .findFirst({
        select: {
          userId: true,
          user: {
            select: {
              username: true,
              email: true,
              fullname: true
            },
          },
        },
        where: { token, recordStatus: 'A' },
      })
      .catch((e) => {
        throw e;
      });

    if (!user) throw { rawErrors: [LOGOUT_ALREADY] } as IApiError;
    else {
      await prisma
        .$transaction([
          prisma.session.update({
            data: {
              recordStatus: 'N',
              updatedAt: new Date(),
              updatedBy: user.userId,
            },
            where: { token, userId: user.userId },
          }),
        ])
        .catch((e) => {
          throw e;
        });

      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'logout',
        json: { username: user.user.username, fullname: user.user.fullname },
        message: `${user.user.fullname} is logged out`,
        createdAt: new Date(),
        createdBy: user.userId,
        createdUsername: user.user.username
      }

      this.addLog([{ flag: `${AuthService.name}`, payload }])
      return { messages: [] } as IMessages;
    }
  }

  /**
   *
   * @param auth
   * @param username
   * @returns
   */
  private async verifyLdap(
    username: string,
    ldap: Ldap
  ): Promise<{ valid: boolean; entries: Entry[] }> {
    const ldapPassword: string = ldap.usePlain
      ? ldap.password
      : await aesCbcDecrypt(ldap.password, process.env.ENCRYPTION_HASH).catch(
        (e) => {
          throw e;
        }
      );

    const client = new Client({
      url: ldap.url,
      // tlsOptions: { rejectUnauthorized: false }
    });

    try {
      const searchDn = this.buildDn(ldap);
      await client
        .bind(this.buildUserMaster(ldap.username, ldap), ldapPassword)
        .catch((e) => {
          throw {
            statusCode: HttpStatusCode.Forbidden,
            stack: e,
            rawErrors: ['error when access ldap-server (bind) #1'],
          } as IApiError;
        });
      const { searchEntries } = await client.search(searchDn as string, {
        scope: 'sub',
        filter: `(${ldap.filter}=${username})` as string & {
          _kind?: 'MyString';
        },
        attributes: [
          'displayName',
          'badPwdCount',
          'employeeID',
          'manager',
          'samAccountName',
          'lockoutTime',
          'lastLogonTimestamp',
          'logonCount',
          'badPasswordTime',
          'lastLogon',
          'pwdLastSet',
          'accountExpires',
        ],
      });

      const valid = searchEntries && searchEntries.length > 0;
      if (!valid) {
        const msg: string[] = [];
        if (!searchEntries || searchEntries.length === 0)
          msg.push(
            `User ID ${username} tidak dapat Kami temukan. Mohon mendaftarkan User ID lain`
          );
        throw { rawErrors: msg } as IApiError;
      }

      return {
        valid,
        entries: searchEntries,
      };
    } catch (error) {
      throw error;
    } finally {
      await client.unbind();
    }
  }

  /**
   *
   * @param username
   * @param ldap
   * @returns
   */
  private buildUserMaster(username: string, ldap: Ldap) {
    return `cn=${username},ou=${ldap.ouLogin},dc=${ldap.dc
      .split('.')
      .join(',dc=')}` as string & { _kind?: 'MyString' };
  }

  /**
   *
   * @param ldap
   * @returns
   */
  private buildDn(ldap: Ldap) {
    return ldap.dc.includes('.')
      ? 'dc=' + ldap.dc.split('.').join(',dc=')
      : undefined;
  }

  /**
   *
   * @param unixT
   * @returns
   */
  private adConvertTime(unixT: string, windowFTime: number = 11644473600) {
    const unixTimestampString: string = unixT;
    const unixTimestamp: bigint = BigInt(unixTimestampString);
    const windowsFileTime: number = Number(unixTimestamp);
    const unixTimestampInSeconds: number =
      windowsFileTime / 10000000 - windowFTime;
    const date: Date = new Date(unixTimestampInSeconds * 1000);

    return date;
  }
}
