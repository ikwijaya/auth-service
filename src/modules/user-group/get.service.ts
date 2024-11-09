import prisma from '@/lib/prisma';
import Service from '@/lib/service';

export default class GetUserGroupService extends Service {
  /**
   *
   * @param mainId
   * @returns
   */
  public async get(mainId: number) {
    return await prisma.userGroup.findFirst({
      where: { mainId },
      select: {
        id: true,
        mainId: true,
        userId: true,
        groupId: true,
        typeId: true,
        makedAt: true,
        makedBy: true,
        checkedAt: true,
        checkedBy: true,
        changelog: true,
        actionCode: true,
        sysAction: true,
        rowAction: true,
        isDefault: true,

        type: {
          select: {
            name: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
        makedUser: {
          select: {
            username: true,
            fullname: true,
          },
        },
        checkedUser: {
          select: {
            username: true,
            fullname: true,
          },
        },
      },
    });
  }
}
