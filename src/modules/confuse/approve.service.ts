import { HttpStatusCode } from 'axios';
import { type ConsentDto } from '@/dto/confuse';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { type INotifQMes, type IAddQueue } from '@/dto/queue.dto';
import { setError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import Service from '@/lib/service';

interface UserItem {
  user: {
    username: string;
    fullname: string | null;
  };
  makedUser: {
    id: number;
    username: string;
    fullname: string | null;
  };
}

export default class ApproveUserGroupService extends Service {
  /**
   *
   * @param auth
   * @param ids
   */
  public async action(auth: IUserAccount, obj: ConsentDto) {
    const check = await prisma.userGroup.findFirst({
      where: {
        id: obj.id,
        actionCode: 'WAITING',
      },
    });

    if (!check)
      throw setError(
        HttpStatusCode.NotFound,
        'Your request is already executed'
      );

    await prisma.$transaction(async (tx) => {
      await tx.userGroup.updateMany({
        data: {
          actionCode: 'APPROVED',
          changelog: obj.changelog,
          checkedAt: new Date(),
          checkedBy: auth.userId,
        },
        where: {
          id: obj.id,
          actionCode: 'WAITING',
        },
      });

      const items = await tx.userGroup.findMany({
        select: {
          makedUser: {
            select: {
              id: true,
              fullname: true,
              username: true,
            },
          },
          user: {
            select: {
              fullname: true,
              username: true,
            },
          },
        },
        where: { id: obj.id },
      });

      this.notif(auth, items);
    });

    const logs: IAddQueue[] = [];
    logs.push({
      flag: ApproveUserGroupService.name,
      payload: {
        serviceName: auth.logAction,
        action: 'approve',
        message: 'Sukses melakukan approve',
        createdAt: new Date(),
        createdBy: auth.userId,
        createdUsername: auth.username,
        roleId: auth.typeId,
        roleName: auth.type?.name,
        device: auth.device,
        ipAddress: auth.ipAddress,
        json: { obj },
      },
    });

    void this.addLog(logs);
    return { messages: ['Sukses menyetujui'] } satisfies IMessages;
  }

  /**
   *
   * @param auth
   * @param requests
   */
  private notif(auth: IUserAccount, requests: UserItem[] = []) {
    const values: IAddQueue[] = [];
    requests.forEach((e) => {
      values.push({
        flag: ApproveUserGroupService.name,
        payload: {
          serviceName: auth.logAction,
          action: 'approve',
          message:
            (auth.fullname ?? auth.username) +
            ' telah menyetujui permintaan user ' +
            (e.user.fullname ?? e.user.username),
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          json: {},
          forUserId: e.makedUser.id,
        } satisfies INotifQMes,
      });
    });

    void this.addNotif(values);
  }
}
