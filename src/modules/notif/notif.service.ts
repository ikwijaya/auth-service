import prisma from '../../lib/prisma';
import Service from '../../lib/service';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { type PushNotifDto } from '@/dto/push-notif.dto';
import { type INotifQMes } from '@/dto/queue.dto';

export class PushNotifService extends Service {
  /**
   *
   * @param username
   */
  private async getUser(username: string) {
    return await prisma.session.findFirst({
      select: {
        userId: true,
        fcmUrl: true,
        user: {
          select: {
            username: true,
            fullname: true,
            email: true,
          },
        },
      },
      where: {
        recordStatus: 'A',
        user: {
          username,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   *
   * @param username
   * @param obj { fromUser: str, toUser: str, message: str, payload: object }
   */
  public async send(auth: IUserAccount, obj: PushNotifDto) {
    const user = await this.getUser(obj.toUser).catch((e) => {
      throw e;
    });

    /// send
    const data: Array<{ flag: string; payload: INotifQMes }> = [];
    data.push({
      flag: 'notif',
      payload: {
        serviceName: PushNotifService.name,
        action: 'bad-login',
        json: obj,
        message: obj.message,
        createdAt: new Date(),
        createdBy: auth.userId,
        createdUsername: auth.username,
        forUserId: user?.userId,
      },
    });

    void this.addNotif(data);

    return { messages: [] } satisfies IMessages;
  }
}
