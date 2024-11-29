import {
  type IUserAccount,
  type IDataWithPagination,
  type IPagination,
  type IQuerySearch,
  type IUserMatrix,
} from '@/dto/common.dto';
import createPagination from '@/lib/pagination';
import { useOrderBy } from '@/lib/parsed-qs';
import prisma from '@/lib/prisma';
import Service from '@/lib/service';

export default class GetAllUserService extends Service {
  /**
   *
   * @param matrix
   * @param pagination
   * @param qs
   * @returns
   */
  public async getAll(
    auth: IUserAccount,
    matrix: IUserMatrix,
    pagination: IPagination,
    qs?: IQuerySearch
  ) {
    const orderBy = useOrderBy(qs, {
      updatedAt: { sort: 'desc', nulls: 'last' },
    });

    const totalRows = await prisma.user.count({
      where: {
        recordStatus: 'A',
        username: { not: 'app.system' },
        AND: [
          {
            OR: [
              { username: { contains: qs?.keyword } },
              { fullname: { contains: qs?.keyword } },
              { email: { contains: qs?.keyword } },
            ],
          },
          {
            createdAt: {
              gte: qs?.startDate ? new Date(qs.startDate) : undefined,
              lt: qs?.endDate ? new Date(qs.endDate) : undefined,
            },
          },
        ],
      },
    });

    if (totalRows === 0)
      return {
        items: [],
        matrix,
        pagination,
      } satisfies IDataWithPagination;

    const _p = createPagination(
      pagination.page,
      pagination.pageSize,
      totalRows
    );
    pagination.currentPage = _p.currentPage;
    pagination.totalPage = _p.totalPages;
    pagination.totalRows = _p.totalRows;

    const items = await prisma.user
      .findMany({
        take: _p.take,
        skip: _p.skip,
        where: {
          recordStatus: 'A',
          username: { not: 'app.system' },
          AND: [
            {
              OR: [
                { username: { contains: qs?.keyword } },
                { fullname: { contains: qs?.keyword } },
                { email: { contains: qs?.keyword } },
              ],
            },
            {
              createdAt: {
                gte: qs?.startDate ? new Date(qs.startDate) : undefined,
                lt: qs?.endDate ? new Date(qs.endDate) : undefined,
              },
            },
          ],
        },
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
        orderBy,
      })
      .catch((e) => {
        throw e;
      });

    return {
      items: items.map((e) => ({
        ...e,
        is_update:
          matrix.is_update && e.id !== auth.userId && e.recordStatus === 'A',
        is_delete:
          matrix.is_delete && e.id !== auth.userId && e.recordStatus === 'A',
      })),
      matrix,
      pagination,
    } satisfies IDataWithPagination;
  }
}
