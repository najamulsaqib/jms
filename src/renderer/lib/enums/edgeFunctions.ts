export const EDGE_FUNCTIONS = {
  CREATE_MANAGED_USER: 'create-managed-user',
  DELETE_MANAGED_USER: 'delete-managed-user',
  BAN_MANAGED_USER: 'ban-managed-user',
} as const;

export type EdgeFunctionName = (typeof EDGE_FUNCTIONS)[keyof typeof EDGE_FUNCTIONS];
