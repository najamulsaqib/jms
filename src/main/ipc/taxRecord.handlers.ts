import { ipcMain } from 'electron';
import {
  type CreateTaxRecordInput,
  TAX_RECORD_CHANNELS,
  type TaxRecord,
  type UpdateTaxRecordInput,
} from '../../shared/taxRecord.contracts';
import { type TaxRecordRepository } from '../db/taxRecord.repository';

export function registerTaxRecordIpcHandlers(
  taxRecordRepository: TaxRecordRepository,
): void {
  ipcMain.removeHandler(TAX_RECORD_CHANNELS.list);
  ipcMain.removeHandler(TAX_RECORD_CHANNELS.getById);
  ipcMain.removeHandler(TAX_RECORD_CHANNELS.create);
  ipcMain.removeHandler(TAX_RECORD_CHANNELS.update);
  ipcMain.removeHandler(TAX_RECORD_CHANNELS.remove);

  ipcMain.handle(TAX_RECORD_CHANNELS.list, (): TaxRecord[] => {
    return taxRecordRepository.listTaxRecords();
  });

  ipcMain.handle(
    TAX_RECORD_CHANNELS.getById,
    (_event, id: number): TaxRecord => {
      return taxRecordRepository.getTaxRecordById(id);
    },
  );

  ipcMain.handle(
    TAX_RECORD_CHANNELS.create,
    (_event, payload: CreateTaxRecordInput): TaxRecord => {
      return taxRecordRepository.createTaxRecord(payload);
    },
  );

  ipcMain.handle(
    TAX_RECORD_CHANNELS.update,
    (_event, id: number, payload: UpdateTaxRecordInput): TaxRecord => {
      return taxRecordRepository.updateTaxRecord(id, payload);
    },
  );

  ipcMain.handle(TAX_RECORD_CHANNELS.remove, (_event, id: number): void => {
    taxRecordRepository.deleteTaxRecord(id);
  });
}
