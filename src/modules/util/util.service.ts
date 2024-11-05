import { type Ldap } from '@prisma/client';
import { Client, type Entry } from 'ldapts';
import { HttpStatusCode } from 'axios';
import prisma from '@/lib/prisma';
import { type IUserAccount } from '@/dto/common.dto';
import { type IApiError } from '@/lib/errors';
import { aesCbcDecrypt } from '@/lib/security';

export default class UtilService {
  /**
   *
   * @param auth
   * @param username
   * @returns
   */
  public async verifyUser(
    auth: IUserAccount,
    username: string
  ): Promise<{ valid: boolean; entries: Entry[] }> {
    if (!auth.ldapId)
      throw { rawErrors: ['Error no ldap config found'] } as IApiError;

    username = username.toLocaleLowerCase();
    const ldap = await prisma.ldap
      .findFirst({
        where: { recordStatus: 'A', id: auth.ldapId },
      })
      .catch((e) => {
        throw e;
      });

    if (!ldap)
      throw { rawErrors: ['no ldap registered in system'] } as IApiError;
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
        .bind(this.buildUser(ldap.username, ldap), ldapPassword)
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
          'dn',
          'mail',
          'displayName',
          'badPwdCount',
          'description',
          'title',
          'telephoneNumber',
          'department',
          'company',
          'memberOf',
          'employeeID',
          'manager',
          'samAccountName',
        ],
      });

      const isExists = await prisma.user
        .findFirst({ where: { username } })
        .catch((e) => {
          throw e;
        });
      const valid = searchEntries && searchEntries.length > 0 && !isExists;
      if (!valid) {
        const msg: string[] = [];
        if (!searchEntries || searchEntries.length === 0)
          msg.push(
            `User ID ${username} tidak dapat Kami temukan. Mohon mendaftarkan User ID lain`
          );
        if (isExists)
          msg.push(
            `User ID ${username} sudah terdaftar. Mohon mendaftarkan User ID lain`
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

  public async metric() {
    return await prisma.$metrics.prometheus();
  }

  private buildUser(username: string, ldap: Ldap) {
    return `cn=${username},ou=${ldap.ouLogin},dc=${ldap.dc
      .split('.')
      .join(',dc=')}` as string & { _kind?: 'MyString' };
  }

  private buildDn(ldap: Ldap) {
    return ldap.dc.includes('.')
      ? 'dc=' + ldap.dc.split('.').join(',dc=')
      : undefined;
  }

  /**
   *
   * @param auth
   * @param username
   * @returns
   */
  public async verifyLdap(
    auth: IUserAccount,
    username: string
  ): Promise<{ valid: boolean; entries: Entry[] }> {
    if (!auth.ldapId)
      throw { rawErrors: ['Error no ldap config found'] } as IApiError;

    const ldap = await prisma.ldap
      .findFirst({
        where: { recordStatus: 'A', id: auth.ldapId },
      })
      .catch((e) => {
        throw e;
      });

    if (!ldap)
      throw { rawErrors: ['no ldap registered in system'] } as IApiError;
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
        .bind(this.buildUser(ldap.username, ldap), ldapPassword)
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
          'dn',
          'mail',
          'displayName',
          'badPwdCount',
          'description',
          'title',
          'telephoneNumber',
          'department',
          'company',
          'memberOf',
          'employeeID',
          'manager',
          'samAccountName',
          'lockoutTime',
          'lastLogonTimestamp',
          'logonCount',
          'badPasswordTime',
          'lastLogon',
          'pwdLastSet',
          'objectClass',
          'accountExpires',
        ],
      });

      const valid = searchEntries && searchEntries.length > 0;
      if (!valid) {
        const msg: string[] = [];
        if (!searchEntries || searchEntries.length === 0)
          msg.push(`${username} tidak ditemukan dalam active directory`);
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
}
