export const TODO_CHANNELS = {
  list: 'todo:list',
  getById: 'todo:getById',
  create: 'todo:create',
  update: 'todo:update',
  remove: 'todo:remove',
} as const;

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title: string;
  completed: boolean;
}
