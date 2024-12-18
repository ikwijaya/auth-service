import { HttpStatusCode } from 'axios';
import { type RefuseDto } from '@/dto/confuse';
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

export default class RejectUserGroupService extends Service {
  /**
   *
   * @param auth
   * @param ids
   */
  public async action(auth: IUserAccount, obj: RefuseDto) {
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
          actionCode: 'REJECTED',
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

      await this.notif(auth, items);
    });

    const logs: IAddQueue[] = [];
    logs.push({
      flag: RejectUserGroupService.name,
      payload: {
        serviceName: auth.logAction,
        action: 'reject',
        message: 'Sukses melakukan reject',
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
    return { messages: ['Sukses menolak'] } satisfies IMessages;
  }

  /**
   *
   * @param auth
   * @param requests
   */
  private async notif(auth: IUserAccount, requests: UserItem[] = []) {
    const maps = requests.map(
      async (e) =>
        await this.addNotif({
          flag: RejectUserGroupService.name,
          payload: {
            serviceName: auth.logAction,
            action: 'approve',
            message:
              (auth.fullname ?? auth.username) +
              ' telah menolak permintaan user ' +
              (e.user.fullname ?? e.user.username),
            createdAt: new Date(),
            createdBy: auth.userId,
            createdUsername: auth.username,
            json: {},
            forUserId: e.makedUser.id,
          } satisfies INotifQMes,
        })
    );

    await Promise.all(maps);
  }
}
