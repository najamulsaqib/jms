import {
  type CreateTaxRecordInput,
  type TaxRecord,
  type TaxRecordStatus,
  type UpdateTaxRecordInput,
} from '../../shared/taxRecord.contracts';

type Database = any;

type TaxRecordRow = {
  id: number;
  reference_number: string;
  name: string;
  cnic: string;
  email: string;
  password: string;
  reference_name: string;
  status: TaxRecordStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

function mapTaxRecordRow(row: TaxRecordRow): TaxRecord {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    name: row.name,
    cnic: row.cnic,
    email: row.email,
    password: row.password,
    reference: row.reference_name,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeInput(input: CreateTaxRecordInput | UpdateTaxRecordInput) {
  return {
    referenceNumber: input.referenceNumber.trim(),
    name: input.name.trim(),
    cnic: input.cnic.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    reference: input.reference.trim(),
    status: input.status,
    notes: input.notes.trim(),
  };
}

function validateInput(input: ReturnType<typeof sanitizeInput>): void {
  if (!input.referenceNumber) {
    throw new Error('Reference number is required.');
  }

  if (!input.name) {
    throw new Error('Name is required.');
  }

  if (!/^\d{13}$/.test(input.cnic)) {
    throw new Error('CNIC must be exactly 13 digits.');
  }

  if (!input.email) {
    throw new Error('Email is required.');
  }

  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    throw new Error('Email format is invalid.');
  }

  if (!input.password.trim()) {
    throw new Error('Password is required.');
  }

  if (!input.reference) {
    throw new Error('Reference is required.');
  }

  if (input.reference.toLowerCase() === input.name.toLowerCase()) {
    throw new Error('Reference must be different from Name.');
  }

  if (!['active', 'inactive', 'late-filer'].includes(input.status)) {
    throw new Error('Status must be active, inactive, or late-filer.');
  }
}

function mapDbConstraintError(err: unknown): never {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    if (msg.includes('cnic') || msg.includes('idx_todos_cnic_unique')) {
      throw new Error('CNIC already exists.');
    }

    if (msg.includes('email') || msg.includes('idx_todos_email_unique')) {
      throw new Error('Email already exists.');
    }

    if (
      msg.includes('reference_number') ||
      msg.includes('idx_todos_reference_number_unique')
    ) {
      throw new Error('Reference number already exists.');
    }
  }

  throw err;
}

export class TaxRecordRepository {
  private readonly hasLegacyTitleColumn: boolean;

  constructor(private readonly db: Database) {
    const columns = this.db.prepare('PRAGMA table_info(todos)').all() as Array<{
      name: string;
    }>;
    this.hasLegacyTitleColumn = columns.some(
      (column) => column.name === 'title',
    );
  }

  listTaxRecords(): TaxRecord[] {
    const rows = this.db
      .prepare(
        'SELECT id, reference_number, name, cnic, email, password, reference_name, status, notes, created_at, updated_at FROM todos ORDER BY id DESC',
      )
      .all() as TaxRecordRow[];

    return rows.map(mapTaxRecordRow);
  }

  createTaxRecord(input: CreateTaxRecordInput): TaxRecord {
    const sanitizedInput = sanitizeInput(input);
    validateInput(sanitizedInput);

    let insertResult: { lastInsertRowid: number | bigint };
    try {
      if (this.hasLegacyTitleColumn) {
        insertResult = this.db
          .prepare(
            'INSERT INTO todos (reference_number, name, title, cnic, email, password, reference_name, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          )
          .run(
            sanitizedInput.referenceNumber,
            sanitizedInput.name,
            sanitizedInput.name,
            sanitizedInput.cnic,
            sanitizedInput.email,
            sanitizedInput.password,
            sanitizedInput.reference,
            sanitizedInput.status,
            sanitizedInput.notes,
          );
      } else {
        insertResult = this.db
          .prepare(
            'INSERT INTO todos (reference_number, name, cnic, email, password, reference_name, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          )
          .run(
            sanitizedInput.referenceNumber,
            sanitizedInput.name,
            sanitizedInput.cnic,
            sanitizedInput.email,
            sanitizedInput.password,
            sanitizedInput.reference,
            sanitizedInput.status,
            sanitizedInput.notes,
          );
      }
    } catch (err) {
      mapDbConstraintError(err);
    }

    const row = this.db
      .prepare(
        'SELECT id, reference_number, name, cnic, email, password, reference_name, status, notes, created_at, updated_at FROM todos WHERE id = ?',
      )
      .get(insertResult.lastInsertRowid) as TaxRecordRow | undefined;

    if (!row) {
      throw new Error('Failed to create tax record.');
    }

    return mapTaxRecordRow(row);
  }

  getTaxRecordById(id: number): TaxRecord {
    const row = this.db
      .prepare(
        'SELECT id, reference_number, name, cnic, email, password, reference_name, status, notes, created_at, updated_at FROM todos WHERE id = ?',
      )
      .get(id) as TaxRecordRow | undefined;

    if (!row) {
      throw new Error('Tax record not found.');
    }

    return mapTaxRecordRow(row);
  }

  updateTaxRecord(id: number, input: UpdateTaxRecordInput): TaxRecord {
    const sanitizedInput = sanitizeInput(input);
    validateInput(sanitizedInput);

    let updateResult: { changes: number };
    try {
      if (this.hasLegacyTitleColumn) {
        updateResult = this.db
          .prepare(
            "UPDATE todos SET reference_number = ?, name = ?, title = ?, cnic = ?, email = ?, password = ?, reference_name = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
          )
          .run(
            sanitizedInput.referenceNumber,
            sanitizedInput.name,
            sanitizedInput.name,
            sanitizedInput.cnic,
            sanitizedInput.email,
            sanitizedInput.password,
            sanitizedInput.reference,
            sanitizedInput.status,
            sanitizedInput.notes,
            id,
          );
      } else {
        updateResult = this.db
          .prepare(
            "UPDATE todos SET reference_number = ?, name = ?, cnic = ?, email = ?, password = ?, reference_name = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
          )
          .run(
            sanitizedInput.referenceNumber,
            sanitizedInput.name,
            sanitizedInput.cnic,
            sanitizedInput.email,
            sanitizedInput.password,
            sanitizedInput.reference,
            sanitizedInput.status,
            sanitizedInput.notes,
            id,
          );
      }
    } catch (err) {
      mapDbConstraintError(err);
    }

    if (updateResult.changes === 0) {
      throw new Error('Tax record not found.');
    }

    return this.getTaxRecordById(id);
  }

  deleteTaxRecord(id: number): void {
    const deleteResult = this.db
      .prepare('DELETE FROM todos WHERE id = ?')
      .run(id);

    if (deleteResult.changes === 0) {
      throw new Error('Tax record not found.');
    }
  }
}
