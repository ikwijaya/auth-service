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
  createdBy: number;
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
  makedBy?: number;
  makedAt: Date;
  rowAction: string;
  sysAction: string;
  actionCode?: string;
  actionNote: string;
  groupId?: number;
  checkedAt: Date;
}

/// DATA
const user: IUser[] = [
  {
    id: 0,
    username: 'app.system',
    createdAt: new Date(),
    makedAt: new Date(),
    rowAction: 'C',
    sysAction: 'submit',
    actionNote: 'added by application.seed',
    actionCode: 'A',
    checkedAt: new Date(),
  },
  {
    id: 1,
    username: 'chb0001',
    createdAt: new Date(),
    makedAt: new Date(),
    rowAction: 'C',
    sysAction: 'submit',
    actionNote: 'added by application.seed',
    actionCode: 'A',
    checkedAt: new Date(),
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
  createdBy: 1,
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
async function seed(): Promise<void> {}

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

const env = process.env.NODE_ENV;
const dbUrl = process.env.DATABASE_URL;
// void main();
if (env === 'development' && dbUrl && /[a-z]+@localhost:[a-z]+/i.test(dbUrl))
  void main();
else logger.info(`only development env can do a seed process`);
