import { ipcMain } from 'electron';
import {
  type CreateTodoInput,
  TODO_CHANNELS,
  type Todo,
} from '../../shared/todo.contracts';
import { type TodoRepository } from '../db/todo.repository';

export function registerTodoIpcHandlers(todoRepository: TodoRepository): void {
  ipcMain.removeHandler(TODO_CHANNELS.list);
  ipcMain.removeHandler(TODO_CHANNELS.create);

  ipcMain.handle(TODO_CHANNELS.list, (): Todo[] => {
    return todoRepository.listTodos();
  });

  ipcMain.handle(
    TODO_CHANNELS.create,
    (_event, payload: CreateTodoInput): Todo => {
      return todoRepository.createTodo(payload);
    },
  );
}
