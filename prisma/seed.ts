import { PrismaClient } from '@prisma/client';
import logger from '../src/lib/logger';

interface IForm {
  id: number;
  name: string;
  url?: string;
  parentId?: number;
  sort: number;
  isReadOnly: boolean;
  createdAt: Date;
  createdBy: number;
  icon?: string;
}

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
  mode: string;
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
  name: string;
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
  username: 'chb0030',
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
    createdAt: new Date(),
    createdBy: 1,
  },
];

const form: IForm[] = [
  {
    id: 1,
    name: 'Dashboard',
    url: '/dashboard',
    sort: 1,
    isReadOnly: true,
    createdAt: new Date(),
    createdBy: 1,
    icon: 'flaticon-home',
  },

  {
    id: 3,
    name: 'Pengelolaan Pengguna',
    sort: 3,
    isReadOnly: true,
    createdAt: new Date(),
    createdBy: 1,
    icon: 'flaticon-user-3',
  },
  {
    id: 4,
    name: 'Laporan',
    sort: 4,
    isReadOnly: true,
    createdAt: new Date(),
    createdBy: 1,
    icon: 'ph ph-gear',
  },

  /// child pengelolaan pengguna
  {
    id: 8,
    name: 'Peran',
    sort: 1,
    isReadOnly: false,
    url: '/privilege',
    createdAt: new Date(),
    createdBy: 1,
    icon: 'ph ph-gear',
    parentId: 3,
  },
  {
    id: 9,
    name: 'Grup',
    sort: 2,
    isReadOnly: false,
    url: '/group',
    createdAt: new Date(),
    createdBy: 1,
    icon: 'ph ph-gear',
    parentId: 3,
  },
  {
    id: 11,
    name: 'Pengguna',
    sort: 4,
    isReadOnly: false,
    url: '/user',
    createdAt: new Date(),
    createdBy: 1,
    icon: 'ph ph-gear',
    parentId: 3,
  },

  /// child laporan
  {
    id: 13,
    name: 'Akses Catatan',
    sort: 1,
    isReadOnly: false,
    url: '/audit-logs',
    createdAt: new Date(),
    createdBy: 1,
    icon: 'ph ph-gear',
    parentId: 4,
  },
];

// saving data
const prisma = new PrismaClient();
async function seed(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await prisma.user.createMany({ data: user });
    await tx.ldap.create({ data: ldap });
    await tx.group.create({ data: { ...group } });
    await tx.type.createMany({ data: privilege });
    await tx.form.createMany({ data: form });
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ data: { ldapId: 1 }, where: { id: 1 } })
    const _user = await tx.user
      .findFirst({ where: { id: 1 } })
      .catch(e => { throw e });

    if (_user)
      await tx.userGroup.create({
        data: {
          userId: _user.id,
          typeId: 1,
          groupId: 1,
          checkedAt: new Date(),
          checkedBy: 1,
          makedAt: new Date(),
          makedBy: 1,
          actionCode: 'APPROVED'
        }
      }).catch(e => { throw e })

    /// get all form then build access
    const forms = await tx.form
      .findMany({
        orderBy: [{ sort: 'asc' }],
        select: {
          id: true,
          name: true,
          isReadOnly: true,
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
      name: e.parent ? `${e.parent.name} > ${e.name}` : e.name,
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

    const accessItems = await buildMatrix(matrix, 1, 1).catch(e => { throw e })
    await tx.access.createMany({ data: accessItems }).catch((e) => {
      throw e;
    });
  })
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
const allow = dbUrl && /@localhost\b/i.test(dbUrl)

if (env === 'development' && dbUrl && allow)
  void main();
else logger.info(`only development env can do a seed process`);
