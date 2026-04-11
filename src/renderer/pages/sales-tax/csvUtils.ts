import { REQUIRED_FIELDS } from './types';

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const allRows: string[][] = [];
  let currentRow: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      currentRow.push(current.trim());
      current = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      currentRow.push(current.trim());
      current = '';
      if (currentRow.some((c) => c !== '')) allRows.push(currentRow);
      currentRow = [];
    } else {
      current += ch;
    }
  }

  if (current.trim() !== '' || currentRow.length > 0) {
    currentRow.push(current.trim());
    if (currentRow.some((c) => c !== '')) allRows.push(currentRow);
  }

  if (allRows.length === 0) return { headers: [], rows: [] };
  return { headers: allRows[0], rows: allRows.slice(1) };
}

export function cleanNumber(raw: string): number {
  const cleaned = raw.replace(/[="]/g, '').replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function autoDetectMapping(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[\s_\-/.]/g, '');

  const aliases: Record<string, string[]> = {
    hsCode: ['hscode', 'hs', 'hscodes', 'hscode'],
    quantity: ['quantity', 'qty', 'units'],
    value: ['value', 'amount', 'totalvalue'],
    salesTax: [
      'salestaxfedinstmode',
      'salestax',
      'tax',
      'fedinst',
      'salestaxfed',
    ],
  };

  for (const field of REQUIRED_FIELDS) {
    const match = headers.find((h) =>
      (aliases[field.id] ?? []).includes(norm(h)),
    );
    if (match) result[field.id] = match;
  }
  return result;
}
