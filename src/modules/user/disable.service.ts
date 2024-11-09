import { HttpStatusCode } from 'axios';
import CreateUserService from './create.service';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { setError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import Service from '@/lib/service';
import { type IAddQueue } from '@/dto/queue.dto';

export default class DisableUserService extends Service {
  /**
   *
   * @param auth
   * @param id
   * @param isActive
   */
  public async del(auth: IUserAccount, id: number, isActive: boolean = false) {
    const user = await prisma.user.findFirst({
      where: { id },
    });

    if (!user)
      throw setError(HttpStatusCode.NotFound, 'Sorry we can`t found user');

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        data: {
          recordStatus: isActive ? 'A' : 'N',
          updatedAt: new Date(),
          updatedBy: auth.userId,
        },
        where: { id },
      });
    });

    const logs: IAddQueue[] = [];
    logs.push({
      flag: CreateUserService.name,
      payload: {
        serviceName: auth.logAction,
        action: isActive ? ' is active' : ' is deactive',
        message:
          (user.fullname ?? user.username) +
          (isActive ? ' is active' : ' is deactive'),
        createdAt: new Date(),
        createdBy: auth.userId,
        createdUsername: auth.username,
        roleId: auth.typeId,
        roleName: auth.type?.name,
        device: auth.device,
        ipAddress: auth.ipAddress,
        json: {
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
      messages: [
        (user.fullname ?? user.username) +
          (isActive ? ' is active' : ' is deactive'),
      ],
    } satisfies IMessages;
  }
}
