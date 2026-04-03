import {
  CreateTaxRecordInput,
  TaxRecord,
  UpdateTaxRecordInput,
} from '@shared/taxRecord.contracts';

type TaxRecordElectronApi = typeof window.electron & {
  taxRecord: {
    list(): Promise<TaxRecord[]>;
    getById(id: number): Promise<TaxRecord>;
    create(payload: CreateTaxRecordInput): Promise<TaxRecord>;
    update(id: number, payload: UpdateTaxRecordInput): Promise<TaxRecord>;
    remove(id: number): Promise<void>;
  };
};

const taxRecordElectron = window.electron as TaxRecordElectronApi;

export const taxRecordApi = {
  list(): Promise<TaxRecord[]> {
    return taxRecordElectron.taxRecord.list();
  },
  getById(id: number): Promise<TaxRecord> {
    return taxRecordElectron.taxRecord.getById(id);
  },
  create(payload: CreateTaxRecordInput): Promise<TaxRecord> {
    return taxRecordElectron.taxRecord.create(payload);
  },
  update(id: number, payload: UpdateTaxRecordInput): Promise<TaxRecord> {
    return taxRecordElectron.taxRecord.update(id, payload);
  },
  remove(id: number): Promise<void> {
    return taxRecordElectron.taxRecord.remove(id);
  },
};
