import { type CreateTodoInput, type Todo } from '../types/todo';

export const todoApi = {
  list(): Promise<Todo[]> {
    return window.electron.todo.list();
  },
  create(payload: CreateTodoInput): Promise<Todo> {
    return window.electron.todo.create(payload);
  },
};
