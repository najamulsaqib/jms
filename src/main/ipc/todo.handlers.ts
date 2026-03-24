import { ipcMain } from 'electron';
import {
  type CreateTodoInput,
  TODO_CHANNELS,
  type Todo,
  type UpdateTodoInput,
} from '../../shared/todo.contracts';
import { type TodoRepository } from '../db/todo.repository';

export function registerTodoIpcHandlers(todoRepository: TodoRepository): void {
  ipcMain.removeHandler(TODO_CHANNELS.list);
  ipcMain.removeHandler(TODO_CHANNELS.getById);
  ipcMain.removeHandler(TODO_CHANNELS.create);
  ipcMain.removeHandler(TODO_CHANNELS.update);
  ipcMain.removeHandler(TODO_CHANNELS.remove);

  ipcMain.handle(TODO_CHANNELS.list, (): Todo[] => {
    return todoRepository.listTodos();
  });

  ipcMain.handle(TODO_CHANNELS.getById, (_event, id: number): Todo => {
    return todoRepository.getTodoById(id);
  });

  ipcMain.handle(
    TODO_CHANNELS.create,
    (_event, payload: CreateTodoInput): Todo => {
      return todoRepository.createTodo(payload);
    },
  );

  ipcMain.handle(
    TODO_CHANNELS.update,
    (_event, id: number, payload: UpdateTodoInput): Todo => {
      return todoRepository.updateTodo(id, payload);
    },
  );

  ipcMain.handle(TODO_CHANNELS.remove, (_event, id: number): void => {
    todoRepository.deleteTodo(id);
  });
}
