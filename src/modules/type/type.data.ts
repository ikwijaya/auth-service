import { ROLE_USER } from "@/enums/role.enum";

/**
 * 
 * @param is = means superadmin
 * @returns 
 */
export const modes = (is: boolean = false): string[] => {
  const role = [...Object.values(ROLE_USER)]

  if (is) role.push(ROLE_USER.SUPERADMIN);
  return role;
};

