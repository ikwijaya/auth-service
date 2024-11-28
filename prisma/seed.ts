import { PrismaClient } from '@prisma/client';
import logger from '../src/lib/logger';
import formJson from './json/form.json';
import optionJson from './json/options.json';

interface IGroup {
  id: number;
  name: string;
  createdAt: Date;
  createdBy: number;
}

interface IPrivilegeType {
  id: number;
  groupId?: number;
  name: string;
  mode?: string;
  flag?: string;
  createdAt: Date;
  createdBy: number;
}

interface ILdap {
  id: number;
  url: string;
  filter: string;
  attrEmail: string;
  attrFullname: string;
  dc: string;
  ouLogin: string;
  ouSearch: string;
  username: string;
  password: string;
  createdAt: Date;
  usePlain: boolean;
  isDefault: boolean;
}

interface IMatrixMenu {
  id: number;
  label: string;
  isReadOnly: boolean;
  roles: IRole[];
}

interface IRole {
  roleName: string;
  roleValue: boolean;
  roleAction: string;
}

interface IUser {
  id: number;
  username: string;
  createdAt: Date;
  groupId?: number;
}

/// DATA
const user: IUser[] = [
  {
    id: 0,
    username: 'app.system',
    createdAt: new Date(),
  },
  {
    id: 1,
    username: 'chb0001',
    createdAt: new Date(),
  },
  {
    id: 2,
    username: 'chb0002',
    createdAt: new Date(),
  },
];

const ldap: ILdap = {
  id: 1,
  url: 'ldap://ldap.mylab.local:389',
  filter: 'samAccountName',
  attrEmail: 'email',
  attrFullname: 'displayName',
  dc: 'mylab.local',
  ouLogin: 'User Accounts',
  ouSearch: 'Special Users',
  username: 'chb0001',
  password: 'Chb$2018',
  createdAt: new Date(),
  usePlain: true,
  isDefault: true,
};

const group: IGroup = {
  id: 1,
  name: 'Default',
  createdAt: new Date(),
  createdBy: 1,
};

const privilege: IPrivilegeType[] = [
  {
    id: 1,
    name: 'superadmin',
    mode: 'superadmin',
    groupId: undefined,
    createdAt: new Date(),
    createdBy: 1,
  },
  {
    id: 2,
    name: 'administrator',
    mode: undefined,
    groupId: undefined,
    createdAt: new Date(),
    createdBy: 1,
  },
];

// saving data
const prisma = new PrismaClient();
async function seed(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.options.createMany({
      data: optionJson.map((e) => ({ ...e, createdAt: new Date() })),
    });
    await tx.user.createMany({ data: user });
    await tx.ldap.create({ data: ldap });
    await tx.group.create({ data: { ...group } });
    await tx.type.createMany({ data: privilege });
    await tx.form.createMany({
      data: formJson.map((e) => ({ ...e, createdBy: 1 })),
    });
    await tx.bullUser.createMany({
      data: user.map((e) => ({
        username: e.username,
        role: 'ro',
        createdAt: new Date(),
        recordStatus: 'A',
      })),
    });

    // register superadmin into group
    const main = await tx.mainUserGroup.create({
      data: { createdAt: new Date() },
    });

    await tx.userGroup.create({
      data: {
        mainId: main.id,
        userId: 1,
        groupId: 1,
        typeId: 1,
        makedBy: 1,
        makedAt: new Date(),
        actionCode: 'APPROVED',
      },
    });
  });

  /**
   *
   * @param ids
   */
  async function matrixUser(
    ids: number[] = [],
    typeId: number,
    createdBy: number
  ) {
    const where =
      ids.length > 0
        ? { recordStatus: 'A', id: { in: ids } }
        : { recordStatus: 'A' };

    const forms = await prisma.form
      .findMany({
        orderBy: [{ sort: 'asc' }],
        select: {
          id: true,
          label: true,
          isReadOnly: true,
          parent: {
            select: {
              label: true,
            },
          },
        },
        where,
      })
      .catch((e) => {
        throw e;
      });

    const matrix: IMatrixMenu[] = forms.map((e) => ({
      id: e.id,
      label: e.parent ? `${e.parent.label} > ${e.label}` : e.label,
      isReadOnly: e.isReadOnly,
      roles: [
        { roleAction: 'C', roleValue: true, roleName: 'CREATE' },
        { roleAction: 'R', roleValue: true, roleName: 'READ' },
        { roleAction: 'U', roleValue: true, roleName: 'UPDATE' },
        { roleAction: 'D', roleValue: true, roleName: 'DELETE' },
        { roleAction: 'A', roleValue: true, roleName: 'UPLOAD' },
        { roleAction: 'B', roleValue: true, roleName: 'DOWNLOAD' },
      ] as IRole[],
    }));

    return await buildMatrix(matrix, typeId, createdBy);
  }

  /**
   * seed for create user identity
   */
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ data: { ldapId: 1 }, where: { id: 1 } });
    const _userAdministrator = await tx.user
      .findFirst({ where: { id: 2 } })
      .catch((e) => {
        throw e;
      });

    if (_userAdministrator) {
      const main = await prisma.mainUserGroup.create({
        data: {
          createdAt: new Date(),
        },
      });

      await tx.userGroup
        .create({
          data: {
            mainId: main.id,
            userId: _userAdministrator.id,
            typeId: 2,
            groupId: 1,
            checkedAt: new Date(),
            checkedBy: 1,
            makedAt: new Date(),
            makedBy: 1,
            actionCode: 'APPROVED',
          },
        })
        .catch((e) => {
          throw e;
        });
    }

    /**
     * 1 = /dashboard
     * 2 = /group
     * 5 = User Management
     *  105 = /user/list
     *  106 = /user/approval
     */
    // define matrix for role superadmin and administrator
    const matrixForSuperadmin = await matrixUser([1, 2, 5, 105, 106], 1, 0);
    await tx.access.createMany({ data: matrixForSuperadmin });

    const matrixForAdministrator = await matrixUser([1, 2, 5, 105, 106], 2, 0);
    await tx.access.createMany({ data: matrixForAdministrator });
  });
}

async function main(): Promise<void> {
  let isError: boolean = false;
  try {
    await seed();
  } catch (e) {
    isError = true;
    logger.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(isError ? 1 : 0);
  }
}

interface IAccessMatrix {
  formId: number;
  typeId: number;
  roleAction: string;
  roleValue: boolean;
  createdAt: Date;
  createdBy: number;
  recordStatus: string;
}

async function buildMatrix(
  items: IMatrixMenu[],
  typeId: number,
  userId: number
): Promise<IAccessMatrix[]> {
  const roles: string[] = ['C', 'R', 'U', 'D', 'A', 'B'];
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

const env = process.env.NODE_ENV;
const dbUrl = process.env.DATABASE_URL;
const allow = dbUrl && /@localhost\b/i.test(dbUrl);

if (env === 'test' && dbUrl && allow) void main();
else logger.info(`only test env can do a seed process`);
