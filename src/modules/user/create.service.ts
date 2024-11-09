import { HttpStatusCode } from 'axios';
import UtilService from '@/modules/util/util.service';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { type CreateUserDto } from '@/dto/user.dto';
import Service from '@/lib/service';
import { setError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import { type IAddQueue } from '@/dto/queue.dto';

export default class CreateUserService extends Service {
  private readonly utilService = new UtilService();

  /**
   *
   * @param auth
   * @param obj
   */
  public async create(auth: IUserAccount, obj: CreateUserDto) {
    const verify = await this.utilService.verifyUser(auth, obj.username);

    if (verify.valid)
      throw setError(HttpStatusCode.Conflict, obj.username + ' already exists');

    const user = await prisma.user.findFirst({
      where: { username: obj.username },
    });

    if (user)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Username is already exist ' + (user.fullname ?? user.username)
      );

    const validGroups = await this.validGroups(
      obj.userGroups.map((e) => e.groupId)
    );

    if (!validGroups)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Sorry, we can`t found some groups.'
      );

    const validRoles = await this.validRoles(
      obj.userGroups.map((e) => ({ groupId: e.groupId, typeId: e.typeId }))
    );

    if (!validRoles.match)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Sorry, your selected role not related with selected group'
      );

    const fullname: string = verify.entries[0].displayName as string;
    const email: string = verify.entries[0].mail as string;
    const dn: string = verify.entries[0].dn;
    const ldapId: number = verify.ldapId;

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user
        .create({
          data: {
            username: obj.username,
            fullname,
            ldapId,
            ldapDn: dn,
            jsonLdap: verify.entries,
            email,
            createdAt: new Date(),
            createdBy: auth.userId,
          },
        })
        .catch((e) => {
          throw e;
        });

      const main = await tx.mainUserGroup.create({
        data: { createdAt: new Date() },
      });

      await tx.userGroup
        .createMany({
          data: this.isSuperadmin(auth)
            ? obj.userGroups.map((e) => ({
                ...e,
                mainId: main.id,
                userId: user.id,
                makedAt: new Date(),
                makedBy: auth.userId,
                actionCode: 'APPROVED',
                rowAction: 'CREATE',
                sysAction: 'SUBMIT',
              }))
            : obj.userGroups
                .filter((e) => e.groupId === auth.groupId)
                .map((e) => ({
                  ...e,
                  mainId: main.id,
                  userId: user.id,
                  makedAt: new Date(),
                  makedBy: auth.userId,
                  actionCode: 'WAITING',
                  rowAction: 'CREATE',
                  sysAction: 'SUBMIT',
                })),
        })
        .catch((e) => {
          throw e;
        });

      const logs: IAddQueue[] = [];
      logs.push({
        flag: CreateUserService.name,
        payload: {
          serviceName: auth.logAction,
          action: 'create',
          message:
            (auth.fullname ?? auth.username) +
            ' submit new request for create user: ' +
            (fullname ?? obj.username),
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
          json: {
            obj,
            user: {
              id: user.id,
              username: user.username,
              dn: user.ldapDn,
              fullname: user.fullname,
              email: user.email,
            },
          },
        },
      });

      void this.addLog(logs);
      return {
        messages: ['Created'],
        payload: {
          user: {
            id: user.id,
            username: user.username,
            dn: user.ldapDn,
            fullname: user.fullname,
            email: user.email,
          },
        },
      } satisfies IMessages;
    });
  }

  /**
   *
   * @param groups
   */
  private async validGroups(groups: number[]) {
    const valid = await prisma.group.findMany({
      where: { id: { in: groups }, recordStatus: 'A' },
    });

    return valid.length === groups.length;
  }

  /**
   *
   * @param roleId
   * @param groupId
   * @returns
   */
  private async validRoles(array: Array<{ groupId: number; typeId: number }>) {
    const valid: Array<{
      group: {
        name: string;
      } | null;
      name: string;
    } | null> = [];

    const map = array.map(async (e) => {
      const find = await prisma.type.findFirst({
        select: {
          name: true,
          group: {
            select: {
              name: true,
            },
          },
        },
        where: {
          id: e.typeId,
          groupId: e.groupId,
          recordStatus: 'A',
        },
      });

      valid.push(find);
    });

    await Promise.all(map);
    return {
      match: valid.filter(this.notEmpty).length === array.length,
      value: valid.filter((e) => e?.group),
    };
  }
}
