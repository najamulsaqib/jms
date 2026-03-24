import {
  type CreateTodoInput,
  type Todo,
  type UpdateTodoInput,
} from '../types/todo';

export const todoApi = {
  list(): Promise<Todo[]> {
    return window.electron.todo.list();
  },
  getById(id: number): Promise<Todo> {
    return window.electron.todo.getById(id);
  },
  create(payload: CreateTodoInput): Promise<Todo> {
    return window.electron.todo.create(payload);
  },
  update(id: number, payload: UpdateTodoInput): Promise<Todo> {
    return window.electron.todo.update(id, payload);
  },
  remove(id: number): Promise<void> {
    return window.electron.todo.remove(id);
  },
};
