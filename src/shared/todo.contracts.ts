export const TODO_CHANNELS = {
  list: 'todo:list',
  create: 'todo:create',
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
