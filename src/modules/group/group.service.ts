import { HttpStatusCode } from 'axios';
import prisma from '@/lib/prisma';
import { setError, type IApiError } from '@/lib/errors';
import {
  type IDataWithPagination,
  type IMessages,
  type IPagination,
  type IUserAccount,
  type IUserMatrix,
  type IQuerySearch,
} from '@/dto/common.dto';
import { type CreateGroupDto, type UpdateGroupDto } from '@/dto/group.dto';
import createPagination from '@/lib/pagination';
import Service from '@/lib/service';
import {
  DEFAULT_DELETED,
  DEFAULT_SUCCESS,
  DEFAULT_UPDATED,
} from '@/utils/constants';
import { type ILogQMes } from '@/dto/queue.dto';
import { useOrderBy } from '@/lib/parsed-qs';

export default class GroupService extends Service {
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
  ): Promise<IDataWithPagination> {
    const orderBy = useOrderBy(qs, {
      updatedAt: { sort: 'desc', nulls: 'last' },
    });
    const totalRows = await prisma.group.count({
      where: {
        name: { contains: qs?.keyword, mode: 'insensitive' },
        recordStatus: 'A',
        createdAt: {
          gte: qs?.startDate ? new Date(qs.startDate) : undefined,
          lt: qs?.endDate ? new Date(qs.endDate) : undefined,
        },
      },
    });

    if (totalRows === 0)
      return {
        items: [],
        matrix,
        pagination: params,
      } satisfies IDataWithPagination;

    const _p = createPagination(params.page, params.pageSize, totalRows);
    params.currentPage = _p.currentPage;
    params.totalPage = _p.totalPages;
    params.totalRows = _p.totalRows;

    const items = await prisma.group
      .findMany({
        take: _p.take,
        skip: _p.skip,
        where: {
          name: { contains: qs?.keyword, mode: 'insensitive' },
          recordStatus: 'A',
          createdAt: {
            gte: qs?.startDate ? new Date(qs.startDate) : undefined,
            lt: qs?.endDate ? new Date(qs.endDate) : undefined,
          },
        },
        select: {
          id: true,
          name: true,
          note: true,
          recordStatus: true,
          Types: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          createdUser: {
            select: {
              username: true,
            },
          },
          updatedUser: {
            select: {
              username: true,
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
        is_update: matrix.is_update && e.recordStatus === 'A',
        is_delete: matrix.is_delete && e.recordStatus === 'A',
      })),
      matrix,
      pagination: params,
    } satisfies IDataWithPagination;
  }

  /**
   *
   * @param auth
   * @param qs
   * @returns
   */
  public async download(
    auth: IUserAccount,
    qs?: IQuerySearch
  ): Promise<unknown> {
    const items = await prisma.group
      .findMany({
        where: {
          name: { contains: qs?.keyword, mode: 'insensitive' },
          createdAt: {
            gte: qs?.startDate ? new Date(qs.startDate) : undefined,
            lt: qs?.endDate ? new Date(qs.endDate) : undefined,
          },
        },
        orderBy: {
          updatedAt: { sort: 'desc', nulls: 'last' },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          createdUser: {
            select: {
              username: true,
            },
          },
          updatedUser: {
            select: {
              username: true,
            },
          },
        },
      })
      .catch((e) => {
        throw e;
      });

    const data = items.map((e) => ({
      namaGroup: e.name,
      tanggalDiEdit: e.updatedAt ? e.updatedAt : e.createdAt,
      diEditOleh: e.updatedUser?.username
        ? e.updatedUser.username
        : e.createdUser.username,
    }));

    return data;
  }

  /**
   *
   * @param id
   */
  public async get(id: number): Promise<unknown> {
    const group = await prisma.group
      .findFirst({
        where: { id },
        select: {
          id: true,
          name: true,
          note: true,
          Types: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          createdUser: {
            select: {
              username: true,
            },
          },
          updatedUser: {
            select: {
              username: true,
            },
          },
        },
      })
      .catch((e) => {
        throw e;
      });

    return group;
  }

  /**
   *
   * @param auth
   * @param obj
   */
  public async create(
    auth: IUserAccount,
    obj: CreateGroupDto
  ): Promise<IMessages | IApiError> {
    obj.createdAt = new Date();
    obj.createdBy = auth.userId;

    return await prisma
      .$transaction(async (tx) => {
        const group = await tx.group
          .create({
            data: obj,
            select: {
              id: true,
              name: true,
            },
          })
          .catch(async (e) => {
            throw e;
          });

        const payload: ILogQMes = {
          serviceName: auth.logAction,
          action: 'create',
          json: { obj },
          message: `${auth.fullname ?? auth.username} is created group ${
            obj.name
          }`,
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
        };

        void this.addLog([{ flag: GroupService.name, payload }]);
        return {
          messages: ['Grup', DEFAULT_SUCCESS],
          payload: group,
        } satisfies IMessages;
      })
      .catch((e) => {
        throw e;
      });
  }

  public async support(): Promise<unknown> {
    return null;
  }

  /**
   *
   * @param auth
   * @param obj
   * @param id
   * @returns
   */
  public async update(
    auth: IUserAccount,
    obj: UpdateGroupDto,
    id: number
  ): Promise<IApiError | IMessages> {
    obj.updatedAt = new Date();
    obj.updatedBy = auth.userId;

    const isExists = await prisma.group
      .findFirst({ where: { id, recordStatus: 'A' } })
      .catch((e) => {
        throw e;
      });

    if (!isExists)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Group tidak ditemukan'
      );

    return await prisma
      .$transaction(async (tx) => {
        await tx.group.update({ data: obj, where: { id } }).catch((e) => {
          throw e;
        });

        const payload: ILogQMes = {
          serviceName: auth.logAction,
          action: 'update',
          json: { before: isExists, after: obj },
          message: `${auth.fullname ?? auth.username} is updated group from ${
            isExists.name
          } to ${obj.name}`,
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
        };

        void this.addLog([{ flag: GroupService.name, payload }]);
        return {
          messages: ['Grup', DEFAULT_UPDATED],
        } satisfies IMessages;
      })
      .catch((e) => {
        throw e;
      });
  }

  /**
   *
   * @param auth
   * @param id
   * @returns
   */
  public async delPersistent(
    auth: IUserAccount,
    id: number
  ): Promise<IApiError | IMessages> {
    const check = await prisma.userGroup
      .findMany({
        where: { groupId: id, actionCode: 'APPROVED', recordStatus: 'A' },
      })
      .catch((e) => {
        throw e;
      });
    if (check.length > 0)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Group masih digunakan oleh beberapa user'
      );

    const type = await prisma.type
      .findFirst({ where: { groupId: id } })
      .catch((e) => {
        throw e;
      });
    if (type)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Group masih digunakan oleh beberapa Peran'
      );

    const isExists = await prisma.group
      .findFirst({ where: { id, recordStatus: 'A' } })
      .catch((e) => {
        throw e;
      });

    if (!isExists)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Group tidak Kami temukan'
      );

    return await prisma
      .$transaction(async (tx) => {
        await tx.group.delete({ where: { id } }).catch((e) => {
          throw e;
        });

        const payload: ILogQMes = {
          serviceName: auth.logAction,
          action: 'delete',
          json: { id, before: isExists },
          message: `${auth.fullname ?? auth.username} is deleted group ${
            isExists.name
          }`,
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
        };

        void this.addLog([{ flag: GroupService.name, payload }]);
        return {
          messages: ['Grup', DEFAULT_DELETED],
        } satisfies IMessages;
      })
      .catch((e) => {
        throw e;
      });
  }
}
