export const TAX_RECORD_CHANNELS = {
  list: 'taxRecord:list',
  getById: 'taxRecord:getById',
  create: 'taxRecord:create',
  update: 'taxRecord:update',
  remove: 'taxRecord:remove',
} as const;

export type TaxRecordStatus = 'active' | 'inactive' | 'late-filer';

export interface TaxRecord {
  id: number;
  referenceNumber: string;
  name: string;
  cnic: string;
  phone: string;
  email: string;
  password: string;
  reference: string;
  status: TaxRecordStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRecordInput {
  referenceNumber: string;
  name: string;
  cnic: string;
  phone: string;
  email: string;
  password: string;
  reference: string;
  status: TaxRecordStatus;
  notes: string;
}

export interface UpdateTaxRecordInput {
  referenceNumber: string;
  name: string;
  cnic: string;
  phone: string;
  email: string;
  password: string;
  reference: string;
  status: TaxRecordStatus;
  notes: string;
}
