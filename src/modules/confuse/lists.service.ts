import {
  type IDataWithPagination,
  type IPagination,
  type IQuerySearch,
  type IUserAccount,
  type IUserMatrix,
} from '@/dto/common.dto';
import createPagination from '@/lib/pagination';
import { useOrderBy } from '@/lib/parsed-qs';
import prisma from '@/lib/prisma';

export default class ListConfuseService {
  /**
   *
   * @param auth
   * @param userId
   * @param matrix
   * @param pagination
   * @param qs
   * @returns
   */
  public async findAll(
    auth: IUserAccount,
    matrix: IUserMatrix,
    pagination: IPagination,
    qs?: IQuerySearch
  ) {
    const orderBy = useOrderBy(qs, {
      makedAt: 'desc',
    });

    const totalRows = await prisma.userGroupView.count({
      where: {
        revId: { not: null },
        groupId: auth.groupId,
        actionCode: 'WAITING',
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
          groupId: auth.groupId,
          actionCode: 'WAITING',
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
          fullName: true,
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
          matrix.is_create &&
          e.userId !== auth.userId &&
          e.actionCode !== 'WAITING',
      })),
      matrix,
      pagination,
    } satisfies IDataWithPagination;
  }
}
