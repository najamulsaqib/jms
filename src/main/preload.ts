// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  type CreateTodoInput,
  TODO_CHANNELS,
  type Todo,
  type UpdateTodoInput,
} from '../shared/todo.contracts';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  todo: {
    list(): Promise<Todo[]> {
      return ipcRenderer.invoke(TODO_CHANNELS.list);
    },
    getById(id: number): Promise<Todo> {
      return ipcRenderer.invoke(TODO_CHANNELS.getById, id);
    },
    create(payload: CreateTodoInput): Promise<Todo> {
      return ipcRenderer.invoke(TODO_CHANNELS.create, payload);
    },
    update(id: number, payload: UpdateTodoInput): Promise<Todo> {
      return ipcRenderer.invoke(TODO_CHANNELS.update, id, payload);
    },
    remove(id: number): Promise<void> {
      return ipcRenderer.invoke(TODO_CHANNELS.remove, id);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
