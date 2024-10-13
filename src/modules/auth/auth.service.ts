import { type Ldap } from '@prisma/client';
import { authenticate, type AuthenticationOptions } from 'ldap-authentication';
import Jwt from 'jsonwebtoken';
import { HttpStatusCode } from 'axios';
import { type Entry, Client } from 'ldapts';
import prisma from '@/lib/prisma';
import { type IApiError } from '@/lib/errors';
import { type LoginResDto, type LoginDto } from '@/dto/auth.dto';
import { type IJwtVerify, type IMessages } from '@/dto/common.dto';
import { aesCbcDecrypt, aesCbcEncrypt } from '@/lib/security';
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
   * @returns
   */
  public async login(obj: LoginDto): Promise<IApiError | LoginResDto> {
    obj.username = obj.username.toLowerCase();
    const userPassword: string = await aesCbcDecrypt(
      obj.password,
      process.env.ENCRYPTION_HASH
    ).catch((e) => {
      throw e;
    });

    /**
     * cek user yg bernilai benar,
     * karena last checkedAt desc
     */
    const user = await prisma.userRev
      .findFirst({
        select: {
          ldap: true,
          id: true,
          userId: true,
          typeId: true,
          username: true,
          fullname: true,
          email: true,
          attempt: true,
          groupId: true,
          group: {
            select: {
              name: true,
            },
          },
          type: {
            select: {
              groupId: true,
              name: true,
            },
          },
        },
        where: {
          username: obj.username.toLowerCase(),
          recordStatus: 'A',
          actionCode: 'A',
        },
        orderBy: {
          checkedAt: 'desc',
        },
      })
      .catch((e) => {
        throw e;
      });

    /**
     * handle user yg sudah di delete or disable
     * agar tidak bisa login lagi
     */
    const userHasDisabled = await prisma.userView
      .findFirst({
        where: {
          username: obj.username.toLowerCase(),
          recordStatus: 'N',
          actionCode: 'A',
        },
        orderBy: { checkedAt: 'desc' },
      })
      .catch((e) => {
        throw e;
      });

    if (userHasDisabled) throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;

    /**
     * set berdasarkan condition
     * yg dihasilkan dari query user
     */
    if (!user) {
      const payload: ILogQMes = {
        serviceName: AuthService.name,
        action: 'bad-login',
        json: { username: obj.username, groupId: obj.groupId },
        message: `${obj.username} failed login`,
        createdAt: new Date()
      }

      this.addLog([{ flag: `${AuthService.name}`, payload }])
      throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;
    } else if (!user.ldap) throw { rawErrors: [LOGIN_FAIL_00] } as IApiError;
    else {
      const verifyDN = await this.verifyLdap(obj.username, user.ldap).catch(
        (e) => {
          throw e;
        }
      );

      if (!verifyDN.valid) throw { rawErrors: [AUTH_FAIL_01] } as IApiError;
      const dn =
        verifyDN.entries.length > 0 ? verifyDN.entries[0].dn : undefined;
      const options: AuthenticationOptions | undefined = {
        ldapOpts: { url: user?.ldap.url },
        userDn: dn,
        userPassword,
        userSearchBase: this.buildDn(user.ldap),
        usernameAttribute: user.ldap.filter,
        username: obj.username,
        attributes: ['dn', 'cn', 'mail', 'displayName'],
      };

      const ldapPassword: string = user.ldap.usePlain
        ? user.ldap.password
        : await aesCbcDecrypt(
          user.ldap.password,
          process.env.ENCRYPTION_HASH
        ).catch((e) => {
          throw e;
        });

      /**
       * in production this binding
       * harus bawa user admin as binder
       */
      if (environment.isProd()) {
        options.adminDn = this.buildUserMaster(user.ldap.username, user.ldap);
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
        if (user.attempt >= maxAttempt && user.ldap) {
          const verifyLdap = await this.verifyLdap(
            obj.username,
            user.ldap
          ).catch((e) => {
            throw e;
          });
          const lockoutTime =
            verifyLdap.valid && verifyLdap.entries.length > 0
              ? verifyLdap.entries[0].lockoutTime
              : undefined;

          logger.warn(`${AuthService.name}: ${lockoutTime}`);
          if (lockoutTime) {
            const date: Date = this.adConvertTime(lockoutTime as string);
            logger.error(
              `login failed ${user.username}, please relogin after ${date}`
            );
            nextLogin.push(`Silakan coba kembali setelah beberapa menit`);
          }

          const payload: ILogQMes = {
            serviceName: AuthService.name,
            action: 'bad-login',
            json: { username: obj.username, groupId: obj.groupId, type: user.type, fullname: user.fullname, lockoutTime },
            message: `${obj.username} failed login: (percobaan: ${user.attempt}x), kesalahan pada username atau password. lock-time: ${lockoutTime}`,
            createdAt: new Date(),
            createdBy: user.id,
            createdUsername: user.username,
            roleId: user.typeId,
            roleName: user.type?.name
          }

          this.addLog([{ flag: `${AuthService.name}`, payload }])
          throw {
            stack: environment.isDev() ? verifyLdap : e,
            rawErrors: [
              `(percobaan: ${user.attempt}x), kesalahan pada username atau password`,
            ].concat(nextLogin),
          } as IApiError;
        }

        await prisma
          .$transaction([
            prisma.user.update({
              where: { id: user.userId },
              data: {
                attempt: user.attempt + 1,
                updatedAt: new Date(),
                updatedBy: user.userId,
              },
            }),
            prisma.userRev.update({
              where: { id: user.id },
              data: {
                attempt: user.attempt + 1,
                updatedAt: new Date(),
                updatedBy: user.userId,
              },
            }),
          ])
          .catch((e) => {
            throw e;
          });

        const payload: ILogQMes = {
          serviceName: AuthService.name,
          action: 'bad-login',
          json: { username: obj.username, groupId: obj.groupId, type: user.type, fullname: user.fullname },
          message: `${obj.username} failed login: (percobaan: ${user.attempt}x), kesalahan pada username atau password`,
          createdAt: new Date(),
          createdBy: user.id,
          createdUsername: user.username,
          roleId: user.typeId,
          roleName: user.type?.name
        }

        this.addLog([{ flag: `${AuthService.name}`, payload }])
        throw {
          rawErrors: [
            `(percobaan: ${user.attempt + 1
            }x), kesalahan pada username atau password`,
          ],
          stack: e,
        } as IApiError;
      });

      /**
       * handle LDAP binding
       */
      if (!valid) {
        await prisma
          .$transaction([
            prisma.user.update({
              where: { id: user.userId },
              data: {
                attempt: user.attempt + 1,
                updatedAt: new Date(),
                updatedBy: user.userId,
              },
            }),
            prisma.userRev.update({
              where: { id: user.id },
              data: {
                attempt: user.attempt + 1,
                updatedAt: new Date(),
                updatedBy: user.userId,
              },
            }),
          ])
          .catch((e) => {
            throw e;
          });

        const payload: ILogQMes = {
          serviceName: AuthService.name,
          action: 'bad-login',
          json: { username: obj.username, groupId: obj.groupId, type: user.type, fullname: user.fullname },
          message: `${obj.username} failed login`,
          createdAt: new Date(),
          createdBy: user.id,
          createdUsername: user.username,
          roleId: user.typeId,
          roleName: user.type?.name
        }

        this.addLog([{ flag: `${AuthService.name}`, payload }])
        throw { rawErrors: [LOGIN_FAIL_01] } as IApiError;
      } else {
        const token = Jwt.sign(
          {
            id: user.userId,
            username: obj.username,
            fullname: user.fullname,
            groupId: user.groupId,
            method: 'original',
            type: 'app-cms',
          } as IJwtVerify,
          process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
          { expiresIn: process.env.JWT_EXPIRE }
        );

        logger.info(`login ${obj.username} valid: OK`);
        await prisma
          .$transaction(async (tx) => {
            await tx.user
              .update({
                where: { id: user.userId },
                data: {
                  fullname: valid.displayName,
                  email: valid.mail,
                  attempt: 0,
                },
              })
              .catch((e) => {
                throw e;
              });

            await tx.userRev
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
                .findMany({ where: { userId: user.userId, recordStatus: 'A' } })
                .catch((e) => {
                  throw e;
                });
              await tx.session
                .updateMany({
                  data: {
                    recordStatus: 'N',
                    updatedAt: new Date(),
                    updatedBy: user.userId,
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
                createdBy: user.userId,
                createdAt: new Date(),
                token,
                type: 'app-cms',
                userId: user.userId,
              },
            });

            const payload: ILogQMes = {
              serviceName: AuthService.name,
              action: 'login',
              json: { username: obj.username, groupId: obj.groupId, type: user.type, fullname: user.fullname },
              message: `${obj.username} success login`,
              createdAt: new Date(),
              createdBy: user.id,
              createdUsername: user.username,
              roleId: user.typeId,
              roleName: user.type?.name
            }

            this.addLog([{ flag: `${AuthService.name}`, payload }])
          })
          .catch((e) => {
            throw e;
          });

        return {
          accessToken: token,
          expiresIn: process.env.JWT_EXPIRE,
          groupId: user.groupId
        } as LoginResDto;
      }
    }
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
              groupId: true,
              typeId: true,
              fullname: true,
              type: {
                select: { name: true },
              },
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
        json: { username: user.user.username, groupId: user.user.groupId, type: user.user.type, fullname: user.user.fullname },
        message: `${user.user.fullname} is logged out`,
        createdAt: new Date(),
        createdBy: user.userId,
        createdUsername: user.user.username,
        roleId: user.user.typeId,
        roleName: user.user.type?.name
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
