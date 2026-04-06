import { type SortState } from '@components/table/DataTable';
import { TaxRecord } from '@shared/taxRecord.contracts';

export type SearchField =
  | 'all'
  | 'referenceNumber'
  | 'name'
  | 'cnic'
  | 'email'
  | 'phone'
  | 'reference'
  | 'status'
  | 'notes';

export const SEARCH_FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'All Fields' },
  { value: 'referenceNumber', label: 'Reference #' },
  { value: 'name', label: 'Name' },
  { value: 'cnic', label: 'CNIC' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'reference', label: 'Reference' },
  { value: 'status', label: 'Status' },
];

export const SEARCH_FIELD_PLACEHOLDER: Record<SearchField, string> = {
  all: 'Search by reference number, name, CNIC, email, phone, reference, status...',
  referenceNumber: 'Search by reference number...',
  name: 'Search by name...',
  cnic: 'Search by CNIC...',
  email: 'Search by email...',
  phone: 'Search by phone...',
  reference: 'Search by reference...',
  status: 'Search by status (active, inactive, late-filer)...',
  notes: 'Search by notes...',
};

export function sortRows(rows: TaxRecord[], sortState: SortState): TaxRecord[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortState.key === 'id') {
      comparison = a.id - b.id;
    } else if (sortState.key === 'referenceNumber') {
      comparison = a.referenceNumber.localeCompare(b.referenceNumber);
    } else if (sortState.key === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortState.key === 'cnic') {
      comparison = a.cnic.localeCompare(b.cnic);
    } else if (sortState.key === 'email') {
      comparison = a.email.localeCompare(b.email);
    } else if (sortState.key === 'reference') {
      comparison = a.reference.localeCompare(b.reference);
    } else if (sortState.key === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortState.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function downloadCSV(records: TaxRecord[]) {
  const headers = [
    'Reference #',
    'Name',
    'CNIC',
    'Email',
    'Password',
    'Reference',
    'Status',
    // 'Notes',
    'Created',
    'Updated',
  ];
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvRows = records.map((r) =>
    [
      r.referenceNumber,
      r.name,
      r.cnic,
      r.email,
      r.password,
      r.reference,
      r.status,
      // r.notes,
      new Date(r.createdAt).toLocaleDateString(),
      new Date(r.updatedAt).toLocaleDateString(),
    ]
      .map(escape)
      .join(','),
  );
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tax-records.csv';
  a.click();
  URL.revokeObjectURL(url);
}
