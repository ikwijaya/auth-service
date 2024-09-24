import prisma from '@/lib/prisma';
import { type PageValidateDto } from '@/dto/user.dto';
import {
  type IUserAccount,
  type IUserMatrix,
  type IPagination,
  type IQuerySearch,
} from '@/dto/common.dto';
import Service from '@/lib/service';

export default class UserService extends Service {


  /**
   *
   * @param auth
   * @param matrix
   * @param params
   * @returns
   */
  public async load(
    auth: IUserAccount,
    matrix: IUserMatrix,
    params: IPagination,
    qs?: IQuerySearch
  ): Promise<void> {


  }

  /**
   *
   * @param auth
   * @returns
   */
  public async me(auth: IUserAccount): Promise<{
    user: unknown;
    loginFail: unknown;
    loginSuccess: unknown;
    totalSessionActive: number;
    totalSessionNonActive: number;
  }> {
    const user = await prisma.userRev
      .findFirst({
        select: {
          id: true,
          userId: true,
          username: true,
          fullname: true,
          email: true,
          attempt: true,
          typeId: true,
          type: {
            select: {
              name: true,
              mode: true,
            },
          },
          groupId: true,
          group: {
            select: {
              name: true,
            },
          },
        },
        where: {
          id: auth.id,
          actionCode: 'A',
        },
        orderBy: {
          checkedAt: 'desc',
        },
      })
      .catch((e) => {
        throw e;
      });

    const lastLogin: { loginFail: unknown; loginSuccess: unknown } | undefined =
      undefined;

    return {
      user,
      loginFail: null,
      loginSuccess: null,
      totalSessionActive: 0,
      totalSessionNonActive: 0,
    };
  }

  /**
   *
   * @param auth
   */
  public async menu(auth: IUserAccount) {
    const access = await prisma.access
      .findMany({
        select: {
          formId: true,
          form: {
            select: {
              parentId: true,
            },
          },
        },
        where: {
          typeId: auth.type?.id,
          roleAction: 'R',
          roleValue: true,
        },
      })
      .catch((e) => {
        throw e;
      });

    const forms = await prisma.form
      .findMany({
        select: {
          id: true,
          name: true,
          url: true,
          color: true,
          icon: true,
          sort: true,
          childs: {
            select: {
              id: true,
              name: true,
              url: true,
              color: true,
              icon: true,
              sort: true,
            },
            where: {
              recordStatus: 'A',
              id: {
                in: access.filter((e) => e.form.parentId).map((e) => e.formId),
              },
            },
            orderBy: [{ sort: 'asc' }],
          },
        },
        where: {
          recordStatus: 'A',
          parentId: null,
          id: {
            in: access.filter((e) => !e.form.parentId).map((e) => e.formId),
          },
        },
        orderBy: [{ sort: 'asc' }],
      })
      .catch((e) => {
        throw e;
      });

    return { forms };
  }

  /**
   *
   * @param auth
   * @returns
   */
  public async support(auth: IUserAccount): Promise<{
    privileges: unknown;
    groups: unknown;
    status: Array<{ text: string; value: string }>;
  }> {
    let groupIds: number[] = [];
    if (!auth.groupId) {
      const getGroup = await prisma.group
        .findMany({ select: { id: true } })
        .catch((e) => {
          throw e;
        });
      groupIds = getGroup.map((e) => e.id);
    } else groupIds = [auth.groupId];

    const groups = await prisma.group
      .findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true },
      })
      .catch((e) => {
        throw e;
      });

    const privileges = await prisma.type
      .findMany({
        select: {
          id: true,
          name: true,
          group: {
            select: {
              name: true,
            },
          },
        },
        where: {
          recordStatus: 'A',
        },
      })
      .catch((e) => {
        throw e;
      });

    return {
      privileges,
      groups,
      status: [
        { text: 'Aktif', value: 'A' },
        { text: 'Tidak Aktif', value: 'N' },
      ],
    };
  }

  /**
   *
   * @param auth
   * @param obj
   * @returns
   */
  public async pageValidate(obj: PageValidateDto): Promise<{
    id: number;
    name: string;
    url: string | null;
  } | null> {
    const UNREGISTER_PATH = process.env.UNREGISTER_PATH ?? '';
    const url = obj.path;
    const menu = await prisma.form
      .findFirst({
        select: {
          id: true,
          name: true,
          url: true,
        },
        where: {
          url: { contains: url },
          recordStatus: 'A',
        },
      })
      .catch((e) => {
        throw e;
      });

    if (menu) return menu;
    else {
      const split = UNREGISTER_PATH.split(',');
      const valid = split.includes(url);

      if (!valid) return null;
      else return { id: 1, name: 'unregister-path', url };
    }
  }
}
