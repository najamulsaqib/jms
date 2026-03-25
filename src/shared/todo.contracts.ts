export const TODO_CHANNELS = {
  list: 'todo:list',
  getById: 'todo:getById',
  create: 'todo:create',
  update: 'todo:update',
  remove: 'todo:remove',
} as const;

export type TodoStatus = 'active' | 'inactive' | 'late-filer';

export interface Todo {
  id: number;
  referenceNumber: string;
  name: string;
  cnic: string;
  email: string;
  password: string;
  reference: string;
  status: TodoStatus;
  notes: string;
  createdAt: string;
}

export interface CreateTodoInput {
  referenceNumber: string;
  name: string;
  cnic: string;
  email: string;
  password: string;
  reference: string;
  status: TodoStatus;
  notes: string;
}

export interface UpdateTodoInput {
  referenceNumber: string;
  name: string;
  cnic: string;
  email: string;
  password: string;
  reference: string;
  status: TodoStatus;
  notes: string;
}
