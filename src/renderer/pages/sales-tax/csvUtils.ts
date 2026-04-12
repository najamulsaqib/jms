import { REQUIRED_FIELDS } from './types';

export function parseCSV(text: string): {
  headers: string[];
  rows: string[][];
} {
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

  const headers = allRows[0];
  // Filter out FBR-format continuation rows — these are description overflow lines
  // that have an empty first cell (no Registration No. / status value).
  const dataRows = allRows.slice(1).filter((row) => row[0] !== '');

  return { headers, rows: dataRows };
}

/**
 * Extracts the pure HS code from FBR export cells that look like:
 *   "3401.2000:-SOAP, ORGANIC SURFACE-ACTIVE AGENTS..."
 *   ="1516.2020"
 * Returns just the leading numeric code, e.g. "3401.2000".
 */
export function extractHsCode(raw: string): string {
  const stripped = raw.replace(/[="]/g, '').trim();
  // Take everything before the first ":- " separator
  const sepIdx = stripped.indexOf(':-');
  const code = sepIdx !== -1 ? stripped.slice(0, sepIdx).trim() : stripped;
  return code;
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
    hsCode: ['hscode', 'hs', 'hscodes'],
    quantity: ['quantity', 'qty', 'units'],
    value: [
      'value',
      'amount',
      'totalvalue',
      'valueofsalesexclst',
      'valueofsales',
      'valueofsalesexcl',
    ],
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
