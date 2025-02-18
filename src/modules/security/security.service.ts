import dayjs from 'dayjs';
import prisma from '@/lib/prisma';
import { type PageValidateDto } from '@/dto/user.dto';
import { type IUserAccount } from '@/dto/common.dto';
import Service from '@/lib/service';

export default class SecurityService extends Service {
  /**
   *
   * @param auth
   * @returns
   */
  public async me(auth: IUserAccount) {
    const failed = await prisma.loginHistory.findFirst({
      select: { createdAt: true },
      where: { status: false, username: auth.username },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const success = await prisma.loginHistory.findFirst({
      select: { createdAt: true },
      where: { status: false, username: auth.username },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const session = await prisma.session.findMany({
      where: { userId: auth.userId },
    });

    const history = await prisma.loginHistory.findMany({
      select: { device: true, ipAddress: true, status: true, createdAt: true },
      where: { username: auth.username },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    let i = 1;
    return {
      ...auth,
      success,
      failed,
      history: history.map((e) => ({
        number: i++,
        ...e,
        createdAt: dayjs(e.createdAt).format('DD MMM YYYY HH:mm:ss'),
        status: e.status ? 'sukses login' : 'gagal login',
      })),
      session: {
        totalCount: session.length,
        totalTime: 0,
      },
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
          typeId: auth.typeId,
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
          label: true,
          path: true,
          color: true,
          icon: true,
          sort: true,
          child: {
            select: {
              id: true,
              label: true,
              path: true,
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

    return forms;
  }

  /**
   *
   * @param auth
   * @param obj
   * @returns
   */
  public async pageValidate(obj: PageValidateDto): Promise<{
    id: number;
    label: string;
    path: string | null;
  } | null> {
    const url = obj.path;
    const menu = await prisma.form
      .findMany({
        select: {
          id: true,
          label: true,
          path: true,
        },
        where: {
          recordStatus: 'A',
          path: { not: null },
        },
      })
      .catch((e) => {
        throw e;
      });

    const isMatch = menu.find((item) => item.path && url.startsWith(item.path));
    if (isMatch) return isMatch;
    else {
      const options = await prisma.options
        .findFirst({
          select: { value: true, key: true },
          where: { flag: 'unknown-route', value: url, recordStatus: 'A' },
        })
        .catch((e) => {
          throw e;
        });

      if (!options) return null;
      // will me fixing later, as soon as possible
      else return { id: 1, label: options.key, path: options.value };
    }
  }
}
