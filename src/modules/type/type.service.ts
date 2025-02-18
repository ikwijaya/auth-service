import { HttpStatusCode } from 'axios';
import prisma from '@/lib/prisma';
import {
  type IDataWithPagination,
  type IMessages,
  type IPagination,
  type IUserAccount,
  type IUserMatrix,
  type IQuerySearch,
} from '@/dto/common.dto';
import { type CreateTypeDto, type UpdateTypeDto } from '@/dto/type.dto';
import { setError, type IApiError } from '@/lib/errors';
import createPagination from '@/lib/pagination';
import AccessService from '@/modules/access/access.service';
import { type IRole, type IMatrixMenu } from '@/dto/access.dto';
import Service from '@/lib/service';
import {
  DEFAULT_DELETED,
  DEFAULT_SUCCESS,
  DEFAULT_UPDATED,
} from '@/utils/constants';
import { type ILogQMes } from '@/dto/queue.dto';
import { useOrderBy } from '@/lib/parsed-qs';
import { ROLE_USER } from '@/enums/role.enum';

export default class TypeService extends Service {
  private readonly AccessService = new AccessService();

  /**
   *
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

    const totalRows = await prisma.type.count({
      where: {
        recordStatus: 'A',
        name: { contains: qs?.keyword, mode: 'insensitive' },
        createdAt: {
          gte: qs?.startDate ? new Date(qs.startDate) : undefined,
          lt: qs?.endDate ? new Date(qs.endDate) : undefined,
        },
      },
    });

    if (totalRows === 0)
      return {
        items: [],
        pagination: params,
        matrix,
      } satisfies IDataWithPagination;

    const _p = createPagination(params.page, params.pageSize, totalRows);
    params.currentPage = _p.currentPage;
    params.totalPage = _p.totalPages;
    params.totalRows = _p.totalRows;

    const items = await prisma.type
      .findMany({
        take: _p.take,
        skip: _p.skip,
        where: {
          recordStatus: 'A',
          name: { contains: qs?.keyword, mode: 'insensitive' },
          createdAt: {
            gte: qs?.startDate ? new Date(qs.startDate) : undefined,
            lt: qs?.endDate ? new Date(qs.endDate) : undefined,
          },
        },
        orderBy,
        select: {
          id: true,
          name: true,
          mode: true,
          flag: true,
          note: true,
          groupId: true,
          group: {
            select: {
              name: true,
            },
          },
          recordStatus: true,
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

    return {
      items: items
        .map((e) => ({
          ...e,
          is_update: matrix.is_update && e.recordStatus === 'A',
          is_delete: matrix.is_delete && e.recordStatus === 'A',
        }))
        .filter((e) => e.mode !== ROLE_USER.SUPERADMIN),
      matrix,
      pagination: params,
    } satisfies IDataWithPagination;
  }

  /**
   *
   * @param matrix
   * @param params
   * @returns
   */
  public async download(
    auth: IUserAccount,
    qs?: IQuerySearch
  ): Promise<unknown> {
    const items = await prisma.type
      .findMany({
        where: {
          recordStatus: 'A',
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
          mode: true,
          flag: true,
          note: true,
          recordStatus: true,
          Access: {
            where: { roleValue: true },
            select: {
              roleAction: true,
              roleValue: true,
              form: {
                select: {
                  id: true,
                  label: true,
                  path: true,
                  parentId: true,
                  parent: {
                    select: {
                      label: true,
                      id: true,
                    },
                  },
                },
              },
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

    interface IMenu {
      roleValue: boolean;
      id: number;
      label: string;
      parent: { id: number; label: string } | null | undefined;
    }
    function flattenMenu(arr: IMenu[]) {
      const result: string[] = [];
      function recursiveFlatten(item: IMenu) {
        if (item.parent) result.push(`${item.parent.label} > ${item.label}`);
        else result.push(item.label);

        // Recursively flatten child items
        arr.forEach((child) => {
          if (child.parent && child.parent.id === item.id)
            recursiveFlatten(child);
        });
      }

      // Start with top-level items
      arr.forEach((item) => {
        if (!item.parent) recursiveFlatten(item);
      });
      return result;
    }

    const data = items.map((e) => ({
      namaPeran: e.name,
      tanggalDiEdit: e.updatedAt ? e.updatedAt : e.createdAt,
      diEditOleh: e.updatedUser?.username
        ? e.updatedUser.username
        : e.createdUser.username,
      matriks: flattenMenu(
        e.Access.map((a) => ({
          roleValue: a.roleValue,
          id: a.form.id,
          label: a.form.label,
          parent: a.form.parent,
        }))
      ),
    }));

    return data;
  }

  /**
   *
   * @param id
   */
  public async get(
    id: number
  ): Promise<{ item: unknown; forms: IMatrixMenu[] }> {
    const item = await prisma.type
      .findFirst({
        where: { id },
        select: {
          id: true,
          name: true,
          mode: true,
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

    const access = await this.AccessService.get(id);
    return {
      item: item?.mode === ROLE_USER.SUPERADMIN ? null : item,
      forms: item?.mode === ROLE_USER.SUPERADMIN ? [] : access.forms,
    };
  }

  /**
   *
   * @param auth
   * @param obj
   */
  public async create(
    auth: IUserAccount,
    obj: CreateTypeDto
  ): Promise<IApiError | IMessages> {
    if (!this.isSuperadmin(auth)) obj.groupId = auth.groupId;
    if (obj.mode === ROLE_USER.SUPERADMIN)
      throw setError(
        HttpStatusCode.BadRequest,
        'Mode (' + obj.mode + ') is denied!, for security reason',
        false
      );

    const groupExists = await prisma.group
      .findFirst({ where: { id: obj.groupId, recordStatus: 'A' } })
      .catch((e) => {
        throw e;
      });

    if (!groupExists)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Group tidak Kami temukan'
      );

    return await prisma
      .$transaction(async (tx) => {
        const type = await tx.type
          .create({
            data: {
              name: obj.name,
              groupId: obj.groupId,
              mode: obj.mode,
              createdAt: new Date(),
              createdBy: auth.userId,
            },
            select: {
              id: true,
              name: true,
              mode: true,
              group: { select: { name: true } },
            },
          })
          .catch((e) => {
            throw e;
          });

        await tx.access
          .deleteMany({ where: { typeId: type.id } })
          .catch((e) => {
            throw e;
          });

        const parentIds: IMatrixMenu[] = obj.forms.filter(
          (e) => e.parentId && e.roles.filter((e) => e.roleValue).length > 0
        );
        const parents = await prisma.form
          .findMany({
            select: {
              id: true,
              label: true,
              sort: true,
              isReadOnly: true,
              parentId: true,
            },
            where: {
              recordStatus: 'A',
              id: {
                in: parentIds.map((e) => e.parentId).filter(this.notEmpty),
              },
            },
          })
          .catch((e) => {
            throw e;
          });

        const parentForms: IMatrixMenu[] = parents.map((e) => ({
          id: e.id,
          label: e.label,
          sort: e.sort,
          isReadOnly: e.isReadOnly,
          parentId: e.parentId,
          roles: [
            { roleAction: 'R', roleValue: true, roleName: 'READ' },
          ] as IRole[],
        }));

        obj.forms = obj.forms.filter(
          (e) => !parents.map((a) => a.id).includes(e.id)
        );
        const matrix = await this.AccessService.buildMatrix(
          obj.forms.concat(parentForms),
          type.id,
          auth.userId
        );
        await tx.access.createMany({ data: matrix }).catch((e) => {
          throw e;
        });

        const payload: ILogQMes = {
          serviceName: auth.logAction,
          action: 'create',
          json: { obj, matrix },
          message: `${auth.fullname ?? auth.username} is created peran ${
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

        void this.addLog([{ flag: TypeService.name, payload }]);
        return {
          messages: ['Peran', DEFAULT_SUCCESS],
          payload: type,
        } satisfies IMessages;
      })
      .catch((e) => {
        throw e;
      });
  }

  /**
   *
   * @param auth
   * @returns
   */
  public async support(auth: IUserAccount): Promise<{
    groups: Array<{ id: number; name: string }>;
    forms: IMatrixMenu[];
    roleType: string[];
  }> {
    const where = auth.groupId
      ? { id: auth.groupId, recordStatus: 'A' }
      : { recordStatus: 'A' };

    const groups = await prisma.group
      .findMany({
        select: { id: true, name: true },
        where,
      })
      .catch((e) => {
        throw e;
      });

    const roles: string[] = Object.values(ROLE_USER);
    const matrix = await this.AccessService.support();
    return {
      groups,
      forms: matrix.forms,
      roleType: this.isSuperadmin(auth)
        ? roles
        : roles.filter((e) => e !== ROLE_USER.SUPERADMIN),
    } satisfies {
      groups: Array<{ id: number; name: string }>;
      forms: IMatrixMenu[];
      roleType: string[];
    };
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
    obj: UpdateTypeDto,
    id: number
  ): Promise<IApiError | IMessages> {
    if (!this.isSuperadmin(auth)) obj.groupId = auth.groupId;
    if (obj.mode === ROLE_USER.SUPERADMIN)
      throw setError(
        HttpStatusCode.BadRequest,
        'Mode (' + obj.mode + ') is denied!, for security reason',
        false
      );

    const groupExists = await prisma.group
      .findFirst({ where: { id: obj.groupId, recordStatus: 'A' } })
      .catch((e) => {
        throw e;
      });
    if (!groupExists)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Group tidak Kami temukan'
      );

    const exist = await prisma.type.findFirst({ where: { id } }).catch((e) => {
      throw e;
    });
    if (!exist)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Peran tidak Kami temukan'
      );

    return await prisma
      .$transaction(async (tx) => {
        await tx.type
          .update({
            data: {
              updatedAt: new Date(),
              updatedBy: auth.userId,
              name: obj.name,
              groupId: obj.groupId,
              mode: obj.mode,
            },
            where: { id },
          })
          .catch((e) => {
            throw e;
          });

        /// get all access foreign with typeId == id
        const accessIds = await tx.access
          .findMany({ select: { id: true }, where: { typeId: id } })
          .catch((e) => {
            throw e;
          });

        /// then delete-all data before
        await tx.access
          .deleteMany({
            where: {
              typeId: id,
              id: { in: accessIds.map((e) => e.id) },
            },
          })
          .catch((e) => {
            throw e;
          });

        /// then inject with new data
        const matrix = await this.AccessService.buildMatrix(
          obj.forms,
          id,
          auth.userId
        );
        await tx.access.createMany({ data: matrix }).catch((e) => {
          throw e;
        });

        const payload: ILogQMes = {
          serviceName: auth.logAction,
          action: 'update',
          json: { matrix, before: exist, after: obj },
          message: `${auth.fullname ?? auth.username} is updated peran from ${
            exist.name
          } to ${obj.name}`,
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
        };

        void this.addLog([{ flag: TypeService.name, payload }]);
        return {
          messages: ['Peran', DEFAULT_UPDATED],
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
        where: { typeId: id, actionCode: 'APPROVED', recordStatus: 'A' },
      })
      .catch((e) => {
        throw e;
      });
    if (check.length > 0)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Peran masih digunakan oleh beberapa User'
      );

    const exist = await prisma.type.findFirst({ where: { id } }).catch((e) => {
      throw e;
    });
    if (!exist)
      throw setError(
        HttpStatusCode.InternalServerError,
        'Peran tidak Kami temukan'
      );

    return await prisma
      .$transaction(async (tx) => {
        const accessIds = await tx.access
          .findMany({ select: { id: true }, where: { typeId: id } })
          .catch((e) => {
            throw e;
          });

        await tx.access
          .deleteMany({
            where: {
              typeId: id,
              id: { in: accessIds.map((e) => e.id) },
            },
          })
          .catch((e) => {
            throw e;
          });

        await tx.type.delete({ where: { id } }).catch((e) => {
          throw e;
        });

        const payload: ILogQMes = {
          serviceName: auth.logAction,
          action: 'delete',
          json: { before: exist, id },
          message: `${auth.fullname ?? auth.username} is deleted peran ${
            exist.name
          }`,
          createdAt: new Date(),
          createdBy: auth.userId,
          createdUsername: auth.username,
          roleId: auth.typeId,
          roleName: auth.type?.name,
          device: auth.device,
          ipAddress: auth.ipAddress,
        };

        void this.addLog([{ flag: TypeService.name, payload }]);
        return {
          messages: ['Peran', DEFAULT_DELETED],
        } satisfies IMessages;
      })
      .catch((e) => {
        throw e;
      });
  }
}
