/// auto -create when for new group
export interface IFormAccess {
  formId: number;
  typeId?: number;
  roleAction: string;
  roleValue: boolean;
  createdAt: Date;
  createdBy?: number;
}

/// / basic role (superadmin) is dashboard, user, group, type/privilege
export const SuperAdminRoleBasic = (): IFormAccess[] => {
  const access: IFormAccess[] = [
    {
      formId: 1,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 2,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },

    /// / user-management
    {
      formId: 3,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 3,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 3,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 3,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },

    /// / group-management
    {
      formId: 4,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 4,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 4,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 4,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },

    /// / privilege-management
    {
      formId: 5,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 5,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 5,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 5,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },

    /// / parameter-management
    {
      formId: 6,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 6,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 6,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 6,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },

    /// / pengelolaan cuti
    {
      formId: 996,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 997,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 998,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },

    /// / audit-trail
    {
      formId: 999,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
  ];

  return access;
};

/// // basic role (businessadmin) is dashboard, user, role
export const BisnisAdminRoleBasic = (): IFormAccess[] => {
  const access: IFormAccess[] = [
    {
      formId: 1,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 2,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },

    /// / user-management
    {
      formId: 3,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 3,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 3,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 3,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },

    /// / privilege-management
    {
      formId: 5,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 5,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 5,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 5,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },

    /// / parameter-management
    {
      formId: 6,
      roleAction: 'C',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 6,
      roleAction: 'R',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 6,
      roleAction: 'U',
      roleValue: true,
      createdAt: new Date(),
    },
    {
      formId: 6,
      roleAction: 'D',
      roleValue: false,
      createdAt: new Date(),
    },
  ];

  return access;
};
