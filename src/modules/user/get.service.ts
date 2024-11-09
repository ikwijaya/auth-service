import prisma from '@/lib/prisma';
import Service from '@/lib/service';

export default class GetUserService extends Service {
  /**
   *
   * @param id
   */
  public async get(id: number) {
    return await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        recordStatus: true,
        createdAt: true,
        updatedAt: true,
        createdUser: {
          select: {
            username: true,
            fullname: true,
          },
        },
        updatedUser: {
          select: {
            username: true,
            fullname: true,
          },
        },
        UserGroup: {
          select: {
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
          },
        },
      },
      where: { id },
    });
  }
}
