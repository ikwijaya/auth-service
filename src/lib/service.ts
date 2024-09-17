import logger from './logger';
import prisma from '@/lib/prisma';

/**
 * `Api` Represents an abstract base class for common expressJS API operations.
 *  Inherit this class to use the helper functions.
 */
abstract class Service {
  /**
   *
   * @param value
   * @returns
   */
  public notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }

  /**
   *
   * @param fid
   * @param groupId
   * @returns
   */
  public async findChecker(fid: number, groupId: number) {
    const type = await prisma.access
      .findMany({
        where: { formId: fid, roleAction: 'R', roleValue: true },
        select: { typeId: true },
      })
      .catch((e) => {
        throw e;
      });

    const users = await prisma.userView
      .findMany({
        where: {
          typeId: { in: type.map((e) => e.typeId).filter(this.notEmpty) },
          groupId,
          recordStatus: 'A',
          actionCode: 'A',
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullname: true,
          actionCode: true,
        },
      })
      .catch((e) => {
        throw e;
      });

    /**
     * because user is on-pending
     * we must check last peran yg di assign pada user tsb
     */
    interface IUserChecker {
      id: number;
      username: string;
      email: string | null;
      fullname: string | null;
      actionCode: string | null;
    }

    const usersIsChange = await prisma.userRev
      .findMany({
        where: {
          recordStatus: 'A',
          actionCode: 'A',
          typeId: { in: type.map((e) => e.typeId).filter(this.notEmpty) },
          groupId,
          userId: { notIn: users.map((e) => e.id).filter(this.notEmpty) },
        },
      })
      .catch((e) => {
        throw e;
      });

    const _u: IUserChecker[] = [];
    const m = usersIsChange.map(async (e) => {
      await prisma.userRev
        .findFirst({
          select: {
            id: true,
            username: true,
            email: true,
            fullname: true,
            actionCode: true,
            userId: true,
          },
          where: { userId: e.userId },
          orderBy: { makedAt: 'desc' },
        })
        .then((r) => {
          if (r) _u.push({ ...r, id: r.userId });
        });
    });

    await Promise.all(m).catch((e) => {
      throw e;
    });
    const waitingUser = _u
      .filter((e) => e.actionCode === 'A')
      .filter((user, index, self) => {
        return self.findIndex((u) => u.username === user.username) === index;
      });

    users
      .concat(waitingUser)
      .forEach((e) =>
        logger.info(
          `${e.actionCode === 'A' ? 'Approved' : 'Last Approved'}: (status: ${
            e.actionCode
          }) FID-${fid}, with GID-${groupId}: send to UID-${e.id}: ${
            e.username
          }`
        )
      );

    return users.concat(waitingUser);
  }

  /**
   *
   * @param ms
   * @returns
   */
  public async wait<T>(ms: number, value: T) {
    return await new Promise<T>((resolve) => setTimeout(resolve, ms, value));
  }

  /**
   *
   * @param formIds number[]
   * @returns
   */
  public async findEmailResponder(formIds: number[]) {
    /**
     * get user when has approved
     */
    const access = await prisma.access
      .findMany({
        select: {
          formId: true,
          typeId: true,
          type: { select: { name: true } },
        },
        where: { roleAction: 'R', roleValue: true, formId: { in: formIds } },
      })
      .catch((e) => {
        throw e;
      });

    const typeIds: number[] = [...new Set(access.map((e) => e.typeId))];
    const users = await prisma.userView.findMany({
      select: {
        id: true,
        email: true,
        fullname: true,
        groupId: true,
        actionCode: true,
      },
      where: {
        actionCode: 'A',
        recordStatus: 'A',
        typeId: { in: typeIds },
      },
    });

    /**
     * handle user when waiting
     * from 1 role to another roles
     */
    const usersIsChange = await prisma.userRev
      .findMany({
        where: {
          recordStatus: 'A',
          actionCode: 'A',
          typeId: { in: typeIds },
          userId: { notIn: users.map((e) => e.id).filter(this.notEmpty) },
        },
      })
      .catch((e) => {
        throw e;
      });

    interface IUserResponder {
      id: number;
      username: string;
      email: string | null;
      fullname: string | null;
      groupId: number | null;
      actionCode: string | null;
    }

    const u: IUserResponder[] = [];
    const map = usersIsChange.map(async (e) => {
      await prisma.userRev
        .findFirst({
          select: {
            id: true,
            username: true,
            email: true,
            fullname: true,
            groupId: true,
            actionCode: true,
          },
          where: { userId: e.userId },
          orderBy: { makedAt: 'desc' },
        })
        .then((r) => {
          if (r) u.push(r);
        });
    });

    await Promise.all(map).catch((e) => {
      throw e;
    });
    const responder = u
      .filter((e) => e.actionCode === 'W')
      .filter((user, index, self) => {
        return self.findIndex((u) => u.username === user.username) === index;
      });

    users
      .concat(responder)
      .forEach((e) =>
        logger.info(
          `${e.actionCode === 'A' ? 'Approved' : 'Last Approved'}: GID: ${
            e.groupId
          } responder email is ${e.email} - ${e.fullname}`
        )
      );

    return users.concat(responder);
  }
}

export default Service;
