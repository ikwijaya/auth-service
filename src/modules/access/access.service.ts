import { HttpStatusCode } from 'axios';
import prisma from '@/lib/prisma';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import {
  type CreateBulkAccessDto,
  type IMatrixMenu,
  type IRole,
} from '@/dto/access.dto';
import { setError } from '@/lib/errors';

interface IAccessMatrix {
  formId: number;
  typeId: number;
  roleAction: string;
  roleValue: boolean;
  createdAt: Date;
  createdBy: number;
  recordStatus: string;
}

export default class AccessService {
  /**
   *
   * @param auth
   * @param obj
   */
  public async bulkCreate(
    auth: IUserAccount,
    obj: CreateBulkAccessDto
  ): Promise<IMessages> {
    const matrix = await this.buildMatrix(
      obj.items,
      obj.typeId,
      auth.userId
    ).catch((e) => {
      throw e;
    });

    if (!obj.items)
      throw setError(HttpStatusCode.InternalServerError, 'no matrix provided');
    if (obj.items.length === 0)
      throw setError(HttpStatusCode.InternalServerError, 'no matrix provided');
    const isTypeExists = await prisma.type
      .findFirst({
        select: { name: true },
        where: { id: obj.typeId, recordStatus: 'A' },
      })
      .catch((e) => {
        throw e;
      });
    if (!isTypeExists)
      throw setError(HttpStatusCode.InternalServerError, 'privilege not found');

    return await prisma
      .$transaction(async (tx) => {
        await tx.access
          .deleteMany({ where: { typeId: obj.typeId } })
          .catch((e) => {
            throw e;
          });
        await tx.access.createMany({ data: matrix }).catch((e) => {
          throw e;
        });

        return { messages: ['Updated'] } satisfies IMessages;
      })
      .catch((e) => {
        throw e;
      });
  }

  public async support(): Promise<{ forms: IMatrixMenu[] }> {
    const forms = await prisma.form
      .findMany({
        orderBy: [{ sort: 'asc' }],
        select: {
          id: true,
          name: true,
          isReadOnly: true,
          parentId: true,
          url: true,
          sort: true,
          parent: {
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

    const matrix: IMatrixMenu[] = forms.map((e) => ({
      id: e.id,
      sort: e.sort,
      name: e.parent ? `${e.parent.name} > ${e.name}` : e.name,
      isReadOnly: e.isReadOnly,
      parentId: e.parentId,
      roles: [
        { roleAction: 'C', roleValue: false, roleName: 'CREATE' },
        {
          roleAction: 'R',
          roleValue: e.url?.toLowerCase() === '/dashboard',
          roleName: 'READ',
        },
        { roleAction: 'U', roleValue: false, roleName: 'UPDATE' },
        { roleAction: 'D', roleValue: false, roleName: 'DELETE' },
        { roleAction: 'A', roleValue: false, roleName: 'UPLOAD' },
        { roleAction: 'B', roleValue: false, roleName: 'DOWNLOAD' },
        { roleAction: 'AV', roleValue: false, roleName: 'ARCHIVE' },
      ] as IRole[],
    }));

    return { forms: matrix };
  }

  /**
   *
   * @param typeId
   * @param userId
   * @returns
   */
  public async get(typeId: number): Promise<{ forms: IMatrixMenu[] }> {
    const forms = await prisma.form
      .findMany({
        orderBy: [
          { parentId: { sort: 'asc', nulls: 'first' } },
          { sort: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          sort: true,
          isReadOnly: true,
          parentId: true,
          parent: {
            select: {
              name: true,
              sort: true,
            },
          },
          Access: {
            where: { typeId, recordStatus: 'A' },
            select: {
              roleAction: true,
              roleValue: true,
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

    const matrix: IMatrixMenu[] = forms.map((e) => {
      return {
        id: e.id,
        parentId: e.parentId,
        sort: e.sort,
        name: e.parentId ? (e.parent?.name ?? '') + ' > ' + e.name : e.name,
        isReadOnly: e.isReadOnly,
        roles: e.Access.map((i) => ({
          roleAction: i.roleAction,
          roleValue: i.roleValue,
          roleName:
            i.roleAction === 'C'
              ? 'CREATE'
              : i.roleAction === 'R'
              ? 'READ'
              : i.roleAction === 'U'
              ? 'UPDATE'
              : i.roleAction === 'D'
              ? 'DELETE'
              : i.roleAction === 'A'
              ? 'UPLOAD'
              : i.roleAction === 'B'
              ? 'DOWNLOAD'
              : i.roleAction === 'AV'
              ? 'ARCHIVE'
              : undefined,
        })).filter((i) => i.roleName) as IRole[],
      };
    });

    return { forms: matrix };
  }

  /**
   *
   * @param items
   * @param typeId
   * @param userId
   * @returns
   */
  public async buildMatrix(
    items: IMatrixMenu[],
    typeId: number,
    userId: number
  ): Promise<IAccessMatrix[]> {
    // const roles: string[] = ['C', 'R', 'U', 'D', 'A', 'B', 'AV'];
    const roles: string[] = ['R'];
    const formReadOnly = items
      .map((e) => (e.isReadOnly ? e.id : null))
      .filter((e) => e);
    return await new Promise((resolve) => {
      const matrix: IAccessMatrix[] = [];
      items.forEach((e) => {
        roles.forEach((role) => {
          matrix.push({
            formId: e.id,
            typeId,
            roleAction: role.toUpperCase(),
            roleValue: !!e.roles.filter(
              (a) =>
                a.roleAction.toUpperCase() === role.toUpperCase() && a.roleValue
            ).length,
            createdAt: new Date(),
            createdBy: userId,
            recordStatus: 'A',
          });
          if (e.isReadOnly) matrix.filter((e) => e.roleAction === 'R');
        });
      });

      const matrixRO = matrix
        .filter((e) => formReadOnly.includes(e.formId))
        .filter((e) => e.roleAction === 'R');
      const matrixRw = matrix.filter((e) => !formReadOnly.includes(e.formId));
      resolve(matrixRO.concat(matrixRw));
    });
  }
}
