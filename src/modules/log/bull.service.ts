import environment from "@/lib/environment";
import { IApiError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { aesCbcDecrypt, generateRandomString } from "@/lib/security";
import { AUTH_FAIL_01 } from "@/utils/constants";
import { Ldap } from "@prisma/client";
import { HttpStatusCode } from "axios";
import { AuthenticationOptions, authenticate } from "ldap-authentication";
import { Entry, Client } from "ldapts";
import redisConnection from "@/lib/ioredis";
import { convertToSeconds } from "@/utils/helper";
import { IBullLoginDto } from "@/dto/bull.dto";

interface ILdapAttr {
  dn?: string;
  cn?: string;
  mail?: string;
  displayName?: string;
}

export class BullService {
  /**
   *
   * @param username
   * @param password
   */
  public async get(obj: IBullLoginDto) {
    const ldap = await prisma.ldap.findFirst().catch(e => { throw e })

    console.log(ldap)
    if (!ldap) throw { rawErrors: ["No LDAP found"] } as IApiError
    const binding = await this.binding(obj.username, obj.password, ldap).catch(e => { throw e })

    console.log(binding)
    if (!binding) throw { rawErrors: ["No User in LDAP"] } as IApiError

    const user = await prisma.bullUser
      .findFirst({
        select: { username: true, role: true },
        where: { username: obj.username, recordStatus: 'A' }
      })
      .catch(e => { throw e })

    console.log(user)

    if (!user) throw { rawErrors: ["User is not whitelisted"] } as IApiError
    const uniqueStr: string = generateRandomString(64, 'ABCDEFGHIJKL')
    const seconds: number = convertToSeconds("8h")
    await redisConnection.set('_mon_', uniqueStr + '_' + Date.now())
    await redisConnection.expire('_mon_', seconds);

    await redisConnection.set('_mon_role', user.role)
    await redisConnection.expire('_mon_role', seconds)

    return user
  }

  /**
   *
   * @param username
   * @param ldap
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
   * @param obj
   * @param username
   * @param password
   * @param ldap
   * @param attempt
   */
  private async binding(
    username: string,
    password: string,
    ldap: Ldap
  ) {
    const verify = await this.verifyLdap(username, ldap)
    if (!verify.valid) throw { rawErrors: [AUTH_FAIL_01] } as IApiError;

    const dn = verify.entries.length > 0 ? verify.entries[0].dn : undefined;
    const options: AuthenticationOptions | undefined = {
      ldapOpts: { url: ldap.url },
      userDn: dn,
      userPassword: password,
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
      throw { rawErrors: [`Bad login`], stack: e, } as IApiError;
    });

    if (valid) return valid
    else throw { rawErrors: ["Bad login"] } as IApiError;
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
}
