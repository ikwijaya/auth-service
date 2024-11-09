import { type IUserAccount } from '@/dto/common.dto';
import prisma from '@/lib/prisma';
import Service from '@/lib/service';

export default class SupportUserService extends Service {
  /**
   *
   * @param auth
   * @returns
   */
  public async getGroupWithRole(auth: IUserAccount) {
    if (this.isSuperadmin(auth))
      return await prisma.group.findMany({
        select: {
          id: true,
          name: true,
          Types: {
            select: {
              id: true,
              name: true,
              mode: true,
            },
          },
        },
        where: { recordStatus: 'A' },
      });
    else
      return await prisma.group.findMany({
        select: {
          id: true,
          name: true,
          Types: {
            select: {
              id: true,
              name: true,
              mode: true,
            },
          },
        },
        where: { recordStatus: 'A', id: auth.groupId },
      });
  }
}
