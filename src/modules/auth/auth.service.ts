import { type Ldap } from '@prisma/client';
import { authenticate, type AuthenticationOptions } from 'ldap-authentication';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { type Entry, Client } from 'ldapts';
import prisma from '@/lib/prisma';
import { setError, type IApiError } from '@/lib/errors';
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
import { type ILogQMes } from '@/dto/queue.dto';
import { convertToSeconds } from '@/utils/helper';
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
      roleName: string;
      groupId?: number;
      groupName?: string;
      device?: string;
      ipAddress?: string;
    },
    username: string,
    password: string,
    ldap: Ldap,
    attempt: number,
    ipAddress?: string,
    device?: string
  ) {
    const verify = await this.verifyLdap(username, ldap);
    if (!verify.valid)
      throw setError(HttpStatusCode.InternalServerError, AUTH_FAIL_01);

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
      username,
      attributes: ['dn', 'cn', 'mail', 'displayName'],
    };

    /**
     * in production this binding
     * harus bawa user admin as binder
     */
    const ldapPassword: string = ldap.usePlain
      ? ldap.password
      : await aesCbcDecrypt(ldap.password, process.env.ENCRYPTION_HASH).catch(
          (e) => {
            throw e;
          }
        );
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
        const lockoutTime =
          verify.valid && verify.entries.length > 0
            ? verify.entries[0].lockoutTime
            : undefined;

        if (lockoutTime) {
          const date: Date = this.adConvertTime(lockoutTime as string);
          logger.error(
            `login failed ${username}, please relogin after ${date.toString()}`
          );
          nextLogin.push(`Silakan coba kembali setelah beberapa menit`);
        }

        const payload: ILogQMes = {
          serviceName: AuthService.name,
          action: 'bad-login',
          json: { username, lockoutTime },
          message: `${username} failed login: (percobaan: ${attempt}x), kesalahan pada username atau password`,
          createdAt: new Date(),
          createdBy: obj.userId,
          createdUsername: username,
          roleId: obj.roleId,
          roleName: obj.roleName,
          device: obj.device,
          ipAddress: obj.ipAddress,
        };

        void this.addLog([{ flag: `${AuthService.name}`, payload }]);
        throw setError(
          HttpStatusCode.InternalServerError,
          [`(percobaan: ${attempt}x), kesalahan pada username atau password`]
            .concat(nextLogin)
            .join('\n'),
          false,
          environment.isDev() ? verify : e
        );
      }

      await prisma
        .$transaction([
          prisma.loginHistory.create({
            data: { username, status: false, ipAddress, device },
          }),
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
        json: { username, groupId: obj.groupId, type: obj.roleName },
        message: `${username} failed login: (percobaan: ${attempt}x), kesalahan pada username atau password`,
        createdAt: new Date(),
        createdBy: obj.userId,
        createdUsername: username,
        roleId: obj.roleId,
        roleName: obj.roleName,
        device: obj.device,
        ipAddress: obj.ipAddress,
      };

      void this.addLog([{ flag: `${AuthService.name}`, payload }]);
      throw setError(
        HttpStatusCode.InternalServerError,
        [`(percobaan: ${attempt + 1}x), kesalahan pada username atau password`]
          .concat(nextLogin)
          .join('\n'),
        false,
        environment.isDev() ? verify : e
      );
    });

    if (valid) return valid;
    else {
      await prisma
        .$transaction([
          prisma.loginHistory.create({
            data: { username, status: false, ipAddress, device },
          }),
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
        json: { username, groupId: obj.groupId },
        message: `${username} failed login`,
        createdAt: new Date(),
        createdBy: obj.userId,
        createdUsername: username,
        roleId: obj.roleId,
        roleName: obj.roleName,
        device: obj.device,
        ipAddress: obj.ipAddress,
      };

      void this.addLog([{ flag: `${AuthService.name}`, payload }]);
      throw setError(HttpStatusCode.InternalServerError, LOGIN_FAIL_01);
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

    if (user) return user;
    else {
      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'bad-login',
        json: { username: obj.username, groupId: obj.groupId },
        message: `${obj.username} failed login`,
        createdAt: new Date(),
        device: obj.device,
        ipAddress: obj.ipAddress,
      };

      void this.addLog([{ flag: `${AuthService.name}`, payload }]);
      throw setError(HttpStatusCode.InternalServerError, LOGIN_FAIL_00);
    }
  }

  /**
   *
   * @param obj
   * @returns
   */
  private async withoutGroup(obj: LoginDto) {
    const user = await this.findUser(obj);
    if (!user)
      throw setError(HttpStatusCode.InternalServerError, LOGIN_FAIL_01);
    const countUserGroup = await prisma.userGroup
      .count({ where: { userId: user?.id } })
      .catch((e) => {
        throw e;
      });

    if (countUserGroup === 0)
      throw setError(
        HttpStatusCode.InternalServerError,
        'You not have group to login'
      );

    const userGroup = await prisma.userGroup
      .findFirst({
        select: {
          groupId: true,
          group: { select: { name: true } },
          typeId: true,
          type: { select: { name: true, mode: true, flag: true } },
        },
        where: {
          userId: user.id,
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
    if (!userGroup)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Please select group before login'
      );
    else return { user, userGroup };
  }

  /**
   *
   * @param obj
   */
  public async login(obj: LoginDto) {
    const { user, userGroup } = await this.withoutGroup(obj).catch((e) => {
      throw e;
    });

    if (!user.ldap)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Your account is not provided by active directory forest'
      );

    const valid = await this.binding(
      {
        userId: user.id,
        roleId: userGroup.typeId,
        roleName: userGroup.type.name,
        groupId: userGroup.groupId,
        groupName: userGroup.group.name,
      },
      obj.username,
      obj.password,
      user.ldap,
      user.attempt
    );

    const token = Jwt.sign(
      {
        id: user.id,
        username: obj.username,
        fullname: user.fullname,
        groupId: userGroup.groupId,
        method: 'original',
        type: 'app-cms',
      } satisfies IJwtVerify,
      process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
      { expiresIn: process.env.JWT_EXPIRE }
    );

    await prisma
      .$transaction(async (tx) => {
        await tx.loginHistory.create({
          data: {
            username: obj.username,
            status: true,
            device: obj.device,
            ipAddress: obj.ipAddress,
          },
        });
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
          logger.info(
            `Multiple session is disable, cause env is ${environment.env}`
          );
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
          logger.info(
            `Multiple session is enable, cause env is ${environment.env}`
          );

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
            fcmUrl: obj.fcmUrl,
          },
        });

        await this.delRedisK('sid_' + obj.username);
        await this.delRedisK('uac_' + obj.username);
        await this.setRedisKV(
          'sid_' + obj.username,
          token,
          convertToSeconds(process.env.JWT_EXPIRE)
        );

        const payload: ILogQMes = {
          serviceName: AuthService.name,
          action: 'login',
          json: {
            username: obj.username,
            groupId: obj.groupId,
            type: userGroup.type,
            fullname: user.fullname,
          },
          message: `${obj.username} success login`,
          createdAt: new Date(),
          createdBy: user.id,
          createdUsername: user.username,
          roleId: userGroup.typeId,
          roleName: userGroup.type?.name,
          device: obj.device,
          ipAddress: obj.ipAddress,
        };

        void this.addLog([{ flag: `${AuthService.name}`, payload }]);
      })
      .catch((e) => {
        throw e;
      });

    return {
      accessToken: 'Bearer ' + token,
      expiresIn: process.env.JWT_EXPIRE,
      groupId: obj.groupId,
    } satisfies LoginResDto;
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

    if (!user)
      throw setError(HttpStatusCode.InternalServerError, LOGIN_FAIL_00);

    /**
     * handle when user status is waiting for approval
     * thats means this user has assign to some group before
     * and this user has waiting for new group after
     */
    const findUserGroup: Array<{ id: number }> =
      await prisma.userGroup.findMany({
        select: { id: true },
        where: {
          user: { username },
          actionCode: 'APPROVED',
        },
      });

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
        where: { id: { in: findUserGroup.map((e) => e.id) }, userId: user.id },
      })
      .catch((e) => {
        throw e;
      });

    const gIds = userGroup.map((e) => e.groupId);
    const groups = await prisma.group
      .findMany({
        select: { id: true, name: true },
        where: {
          id: { in: gIds },
        },
      })
      .catch((e) => {
        throw e;
      });

    return {
      messages: [],
      payload: { groups: Array.from(new Set(groups)) },
    } satisfies IMessages;
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
              fullname: true,
            },
          },
        },
        where: { token, recordStatus: 'A' },
      })
      .catch((e) => {
        throw e;
      });

    if (!user)
      throw setError(HttpStatusCode.InternalServerError, LOGOUT_ALREADY);
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

      await this.delRedisK('sid_' + user.user.username);
      await this.delRedisK('uac_' + user.user.username);
      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'logout',
        json: { username: user.user.username, fullname: user.user.fullname },
        message: `${user.user.fullname ?? user.user.username} is logged out`,
        createdAt: new Date(),
        createdBy: user.userId,
        createdUsername: user.user.username,
      };

      void this.addLog([{ flag: `${AuthService.name}`, payload }]);
      return { messages: [] } satisfies IMessages;
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
          throw setError(
            HttpStatusCode.InternalServerError,
            'Error bind..',
            false,
            e
          );
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
        throw setError(HttpStatusCode.InternalServerError, msg.join('\n'));
      }

      return {
        valid,
        entries: searchEntries,
      };
      // eslint-disable-next-line no-useless-catch
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
