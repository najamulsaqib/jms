export interface UserPermissions {
  id: string;
  userId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canBulkOperations: boolean;
  canExport: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateUserPermissionsInput = Partial<
  Pick<
    UserPermissions,
    'canCreate' | 'canUpdate' | 'canDelete' | 'canBulkOperations' | 'canExport'
  >
>;

/** Full permissions granted to admin users — no DB lookup required */
export const ADMIN_PERMISSIONS: Omit<
  UserPermissions,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
> = {
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canBulkOperations: true,
  canExport: true,
};
