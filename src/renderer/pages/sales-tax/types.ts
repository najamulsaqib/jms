export type Step = 'upload' | 'map' | 'results';

export type SummaryRow = {
  hsCode: string;
  invoiceCount: number;
  quantity: number;
  value: number;
  saleRevenue: number;
  salesTax: number;
};

export type ValidationIssue = { row: number; reason: string };

export const REQUIRED_FIELDS: { id: string; label: string }[] = [
  { id: 'hsCode', label: 'HS Code' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'value', label: 'Value' },
  { id: 'salesTax', label: 'Sales Tax / FED in ST Mode' },
];

export const fmt = (n: number) =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
