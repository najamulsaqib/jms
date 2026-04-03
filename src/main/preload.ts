// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  type CreateTaxRecordInput,
  TAX_RECORD_CHANNELS,
  type TaxRecord,
  type UpdateTaxRecordInput,
} from '../shared/taxRecord.contracts';

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
  taxRecord: {
    list(): Promise<TaxRecord[]> {
      return ipcRenderer.invoke(TAX_RECORD_CHANNELS.list);
    },
    getById(id: number): Promise<TaxRecord> {
      return ipcRenderer.invoke(TAX_RECORD_CHANNELS.getById, id);
    },
    create(payload: CreateTaxRecordInput): Promise<TaxRecord> {
      return ipcRenderer.invoke(TAX_RECORD_CHANNELS.create, payload);
    },
    update(id: number, payload: UpdateTaxRecordInput): Promise<TaxRecord> {
      return ipcRenderer.invoke(TAX_RECORD_CHANNELS.update, id, payload);
    },
    remove(id: number): Promise<void> {
      return ipcRenderer.invoke(TAX_RECORD_CHANNELS.remove, id);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
