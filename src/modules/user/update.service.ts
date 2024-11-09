import { HttpStatusCode } from 'axios';
import CreateUserService from './create.service';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { type UserGroupDto, type UpdateUserDto } from '@/dto/user.dto';
import { setError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import Service from '@/lib/service';
import { type IAddQueue } from '@/dto/queue.dto';

export default class UpdateUserService extends Service {
  /**
   *
   * @param auth
   * @param id
   * @param obj
   */
  public async update(auth: IUserAccount, id: number, obj: UpdateUserDto) {
    const user = await prisma.user.findFirst({
      where: { id, recordStatus: 'A' },
    });

    if (!user) throw setError(HttpStatusCode.NotFound, 'User not found');

    const compareWaiting = await this.compareWaiting(
      id,
      obj.userGroups.map((e) => e.groupId)
    );

    if (compareWaiting.length > 0)
      throw setError(
        HttpStatusCode.InternalServerError,
        compareWaiting
          .map(
            (e) =>
              e.groupName +
              ' is waiting for approval, submitted by ' +
              e.makedUser +
              ' at ' +
              e.makedAt?.toString()
          )
          .join('\n')
      );

    const groupIds = compareWaiting.map((e) => e.groupId);
    const exUserGroups = obj.userGroups.filter(
      (e) => !groupIds.includes(e.groupId)
    );

    const validGroups = await this.validGroups(
      exUserGroups.map((e) => e.groupId)
    );

    if (!validGroups)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Sorry, we can`t found some groups.'
      );

    const validRoles = await this.validRoles(
      exUserGroups.map((e) => ({ groupId: e.groupId, typeId: e.typeId }))
    );

    if (!validRoles.match)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Sorry, your selected role not related with selected group'
      );

    const _createObjs = exUserGroups.filter(
      (e) => !e.mainId && e.rowAction === 'CREATE'
    );

    const _updateObjs = exUserGroups.filter(
      (e) => e.mainId && e.rowAction === 'UPDATE'
    );

    const _deleteObjs = exUserGroups.filter(
      (e) => e.mainId && e.rowAction === 'DELETE'
    );

    await this._create(auth, id, _createObjs);
    await Promise.all([
      this._create(auth, id, _createObjs),
      this._update(auth, id, _updateObjs),
      this._delete(auth, id, _deleteObjs),
    ]);

    return { messages: ['Created'] } satisfies IMessages;
  }

  /**
   *
   * @param auth
   * @param id
   * @param data
   * @returns
   */
  private async _create(auth: IUserAccount, id: number, data: UserGroupDto[]) {
    await prisma.$transaction(async (tx) => {
      const main = await tx.mainUserGroup.create({
        data: { createdAt: new Date() },
      });

      await tx.userGroup.createMany({
        data: this.isSuperadmin(auth)
          ? data.map((e) => ({
              ...e,
              mainId: main.id,
              userId: id,
              makedAt: new Date(),
              makedBy: auth.userId,
              actionCode: 'APPROVED',
              rowAction: 'CREATE',
              sysAction: 'SUBMIT',
            }))
          : data
              .filter((e) => e.groupId === auth.groupId)
              .map((e) => ({
                ...e,
                userId: id,
                makedAt: new Date(),
                makedBy: auth.userId,
                actionCode: 'WAITING',
                rowAction: 'CREATE',
                sysAction: 'SUBMIT',
              })),
      });

      const groups: Array<{ name: string }> = await prisma.group.findMany({
        where: { id: { in: data.map((e) => e.groupId) } },
      });

      const logs: IAddQueue[] = [];
      logs.push({
        flag: CreateUserService.name,
        payload: {
          serviceName: auth.logAction,
          action: this._create.name,
          message:
            (auth.fullname ?? auth.username) +
            ' submit request for create new access for groups ' +
            groups.map((e) => e.name).join(', '),
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
          json: { data },
        },
      });

      void this.addLog(logs);
    });
  }

  /**
   *
   * @param auth
   * @param id
   * @param data
   * @returns
   */
  private async _update(auth: IUserAccount, id: number, data: UserGroupDto[]) {
    await prisma.$transaction(async (tx) => {
      await tx.userGroup.createMany({
        data: this.isSuperadmin(auth)
          ? data.map((e) => ({
              ...e,
              userId: id,
              makedAt: new Date(),
              makedBy: auth.userId,
              actionCode: 'APPROVED',
              rowAction: 'UPDATE',
              sysAction: 'SUBMIT',
            }))
          : data
              .filter((e) => e.groupId === auth.groupId)
              .map((e) => ({
                ...e,
                userId: id,
                makedAt: new Date(),
                makedBy: auth.userId,
                actionCode: 'WAITING',
                rowAction: 'UPDATE',
                sysAction: 'SUBMIT',
              })),
      });

      const groups: Array<{ name: string }> = await prisma.group.findMany({
        where: { id: { in: data.map((e) => e.groupId) } },
      });

      const logs: IAddQueue[] = [];
      logs.push({
        flag: CreateUserService.name,
        payload: {
          serviceName: auth.logAction,
          action: this._update.name,
          message:
            (auth.fullname ?? auth.username) +
            ' submit request for update existing access for groups ' +
            groups.map((e) => e.name).join(', '),
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
          json: { data },
        },
      });

      void this.addLog(logs);
    });
  }

  /**
   *
   * @param auth
   * @param id
   * @param data
   * @returns
   */
  private async _delete(auth: IUserAccount, id: number, data: UserGroupDto[]) {
    await prisma.$transaction(async (tx) => {
      await tx.userGroup.createMany({
        data: this.isSuperadmin(auth)
          ? data.map((e) => ({
              ...e,
              userId: id,
              makedAt: new Date(),
              makedBy: auth.userId,
              actionCode: 'APPROVED',
              rowAction: 'DELETE',
              sysAction: 'SUBMIT',
            }))
          : data
              .filter((e) => e.groupId === auth.groupId)
              .map((e) => ({
                ...e,
                userId: id,
                makedAt: new Date(),
                makedBy: auth.userId,
                actionCode: 'WAITING',
                rowAction: 'DELETE',
                sysAction: 'SUBMIT',
              })),
      });

      const groups: Array<{ name: string }> = await prisma.group.findMany({
        where: { id: { in: data.map((e) => e.groupId) } },
      });

      const logs: IAddQueue[] = [];
      logs.push({
        flag: CreateUserService.name,
        payload: {
          serviceName: auth.logAction,
          action: this._delete.name,
          message:
            (auth.fullname ?? auth.username) +
            ' submit request for delete existing access for groups ' +
            groups.map((e) => e.name).join(', '),
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
          json: { data },
        },
      });

      void this.addLog(logs);
    });
  }

  /**
   *
   * @param userId
   * @param groupId
   */
  private async isWaiting(userId: number, groupId: number) {
    return await prisma.userGroup.findFirst({
      select: {
        id: true,
        groupId: true,
        actionCode: true,
        user: {
          select: {
            username: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
        makedAt: true,
        makedUser: {
          select: {
            username: true,
            fullname: true,
          },
        },
      },
      where: {
        userId,
        groupId,
        actionCode: 'WAITING',
        checkedAt: null,
      },
      orderBy: {
        makedAt: 'desc',
      },
    });
  }

  /**
   *
   * @param userId
   * @param groupIds
   */
  private async compareWaiting(userId: number, groupIds: number[]) {
    const res: Array<{
      groupId: number;
      groupName: string;
      makedUser: string;
      makedAt: Date;
    }> = [];

    const map = groupIds.map(async (e) => {
      const value = await this.isWaiting(userId, e);
      if (value)
        res.push({
          groupId: value.groupId,
          groupName: value.group.name,
          makedUser: value.makedUser.fullname ?? value.makedUser.username,
          makedAt: value.makedAt,
        });
    });

    await Promise.all(map);
    return res;
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
