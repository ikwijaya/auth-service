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

export default class GetAllUserGroupService extends Service {
  /**
   *
   * @param matrix
   * @param pagination
   * @param qs
   * @returns
   */
  public async getAll(
    auth: IUserAccount,
    userId: number,
    matrix: IUserMatrix,
    pagination: IPagination,
    qs?: IQuerySearch
  ) {
    const orderBy = useOrderBy(qs, {
      makedAt: { sort: 'desc', nulls: 'last' },
    });

    const totalRows = await prisma.userGroupView.count({
      where: {
        revId: { not: null },
        userId,
        makedAt: {
          gte: qs?.startDate ? new Date(qs.startDate) : undefined,
          lt: qs?.endDate ? new Date(qs.endDate) : undefined,
        },
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

    const items = await prisma.userGroupView
      .findMany({
        take: _p.take,
        skip: _p.skip,
        where: {
          revId: { not: null },
          userId,
          makedAt: {
            gte: qs?.startDate ? new Date(qs.startDate) : undefined,
            lt: qs?.endDate ? new Date(qs.endDate) : undefined,
          },
        },
        select: {
          id: true,
          revId: true,
          userId: true,
          groupId: true,
          typeId: true,
          groupName: true,
          typeName: true,
          makedAt: true,
          makedBy: true,
          makedName: true,
          checkedAt: true,
          checkedBy: true,
          checkedName: true,
          changelog: true,
          actionCode: true,
          sysAction: true,
          rowAction: true,
          isDefault: true,
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
          matrix.is_update &&
          e.userId !== auth.userId &&
          e.actionCode !== 'WAITING',
        is_delete:
          matrix.is_delete &&
          e.userId !== auth.userId &&
          e.actionCode !== 'WAITING',
      })),
      matrix,
      pagination,
    } satisfies IDataWithPagination;
  }
}
