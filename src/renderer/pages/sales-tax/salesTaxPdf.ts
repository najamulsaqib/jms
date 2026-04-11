import { jsPDF } from 'jspdf';
import { type SummaryRow } from './types';

export type PdfCompanyInfo = {
  name: string;
  tagline?: string;
  phone: string;
  address: string;
  contactName: string;
};

// Resolves only the fields the user actually filled in.
function resolvePdfCompanyInfo(
  overrides?: Partial<PdfCompanyInfo>,
): Partial<PdfCompanyInfo> {
  if (!overrides) return {};

  const result: Partial<PdfCompanyInfo> = {};

  for (const key of Object.keys(overrides) as Array<keyof PdfCompanyInfo>) {
    const value = overrides[key];
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }

  return result;
}

// ── Colour palette ─────────────────────────────────────────────────────────────
const C = {
  blue600: [37, 99, 235] as [number, number, number],
  blue700: [29, 78, 216] as [number, number, number],
  blue800: [30, 64, 175] as [number, number, number],
  blue100: [219, 234, 254] as [number, number, number],
  slate900: [15, 23, 42] as [number, number, number],
  slate600: [71, 85, 105] as [number, number, number],
  slate400: [148, 163, 184] as [number, number, number],
  slate200: [226, 232, 240] as [number, number, number],
  slate50: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  rowAlt: [243, 248, 255] as [number, number, number],
};

// ── Layout constants ───────────────────────────────────────────────────────────
const PAGE_W = 297;
const PAGE_H = 210;
const ML = 18; // margin left
const MR = 18; // margin right
const HEADER_H = 40; // main header height (first page)
const CONT_HDR_H = 14; // continuation header height (subsequent pages)
const FOOTER_H = 22; // footer height reserved at bottom
const ROW_H = 8;
const HDR_ROW_H = 10;

// Safe bottom boundary before the footer starts
const SAFE_BOTTOM = PAGE_H - FOOTER_H - 4;

export function generateSalesTaxPdf(
  summary: SummaryRow[],
  revenuePercentage: number = 1.5,
  companyInfoOverrides?: Partial<PdfCompanyInfo>,
  generatedBy?: string,
) {
  const companyInfo = resolvePdfCompanyInfo(companyInfoOverrides);

  const fmtN = (n: number) =>
    n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const genDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // eslint-disable-next-line new-cap
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentPage = 1;
  let y = 0;

  const drawMainHeader = () => {
    doc.setFillColor(...C.blue600);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

    doc.setFillColor(...C.blue800);
    doc.rect(0, HEADER_H - 1, PAGE_W, 1, 'F');

    if (companyInfo.name) {
      doc.setTextColor(...C.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(companyInfo.name, ML, 12);
    }

    if (companyInfo.tagline) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C.blue100);
      doc.text(companyInfo.tagline, ML, 20);
    }

    // Generated date (top-right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    doc.text(`Generated: ${genDate}`, PAGE_W - MR, 15, { align: 'right' });

    // Report title (bottom bar)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.white);
    doc.text('HS Code Summary Report', ML, 33);
  };

  const drawContinuationHeader = () => {
    doc.setFillColor(...C.blue600);
    doc.rect(0, 0, PAGE_W, CONT_HDR_H, 'F');

    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const contLabel = companyInfo.name
      ? `${companyInfo.name} — HS Code Summary (continued)`
      : 'HS Code Summary (continued)';
    doc.text(contLabel, ML, 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.blue100);
    doc.text(genDate, PAGE_W - MR, 9.5, { align: 'right' });
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const fy = PAGE_H - FOOTER_H;

    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.4);
    doc.line(ML, fy, PAGE_W - MR, fy);

    // Company name (left) — omitted if not set
    if (companyInfo.name) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.blue600);
      doc.text(companyInfo.name, ML, fy + 6);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.slate400);
    doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MR, fy + 6, {
      align: 'right',
    });

    // Contact row — only rendered when at least one contact field is set
    const contactLeft = [companyInfo.contactName, companyInfo.phone]
      .filter(Boolean)
      .join('  •  ');

    if (contactLeft || companyInfo.address) {
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.2);
      doc.line(ML, fy + 8.5, PAGE_W - MR, fy + 8.5);

      doc.setFontSize(7.5);
      doc.setTextColor(...C.slate600);

      if (contactLeft) doc.text(contactLeft, ML, fy + 13.5);
      if (companyInfo.address)
        doc.text(companyInfo.address, PAGE_W - MR, fy + 13.5, {
          align: 'right',
        });
    }

    // Confidential badge
    doc.setFontSize(7);
    doc.setTextColor(...C.slate400);
    doc.text('Confidential Document', ML, fy + 19);
    const genLabel = generatedBy
      ? `Generated by ${generatedBy}: ${genDate}`
      : `Generated: ${genDate}`;
    doc.text(genLabel, PAGE_W - MR, fy + 19, { align: 'right' });
  };

  const addPage = () => {
    doc.addPage();
    currentPage++;
    drawContinuationHeader();
    y = CONT_HDR_H + 6;
  };

  const drawTableHeader = () => {
    const cols = [
      { label: 'HS Code', width: 50 },
      { label: 'Invoices', width: 26 },
      { label: 'Quantity', width: 40 },
      { label: 'Value (PKR)', width: 42 },
      { label: `Sale Revenue (+${revenuePercentage}%)`, width: 55 },
      { label: 'Sales Tax (PKR)', width: 48 },
    ];

    let x = ML;
    for (const col of cols) {
      doc.setFillColor(...C.blue600);
      doc.setDrawColor(...C.blue800);
      doc.setLineWidth(0.2);
      doc.rect(x, y, col.width, HDR_ROW_H, 'FD');
      x += col.width;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    x = ML;
    for (const col of cols) {
      doc.text(col.label, x + 2, y + 6.5, {
        align: 'left',
        maxWidth: col.width - 4,
      });
      x += col.width;
    }
    y += HDR_ROW_H;
  };

  const drawDataRow = (row: SummaryRow, index: number) => {
    if (y + ROW_H > SAFE_BOTTOM) {
      addPage();
      drawTableHeader();
    }

    const cols = [
      { width: 50 },
      { width: 26 },
      { width: 40 },
      { width: 42 },
      { width: 55 },
      { width: 48 },
    ];

    const bg = index % 2 === 1 ? C.rowAlt : C.white;
    let x = ML;
    for (const col of cols) {
      doc.setFillColor(...bg);
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.2);
      doc.rect(x, y, col.width, ROW_H, 'FD');
      x += col.width;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.slate900);
    x = ML;

    const vals = [
      row.hsCode,
      row.invoiceCount.toLocaleString(),
      fmtN(row.quantity),
      fmtN(row.value),
      fmtN(row.saleRevenue),
      fmtN(row.salesTax),
    ];

    for (let i = 0; i < cols.length; i++) {
      const isLast = i === cols.length - 1;
      const col = cols[i];
      const align = i === 0 ? 'left' : 'right';
      const tx = align === 'right' ? x + col.width - 2 : x + 2;
      doc.text(vals[i], tx, y + 5, { align });
      x += col.width;
    }

    y += ROW_H;
  };

  const drawTotalsRow = () => {
    if (y + ROW_H > SAFE_BOTTOM) {
      addPage();
      drawTableHeader();
    }

    const totals = summary.reduce(
      (acc, r) => ({
        invoiceCount: acc.invoiceCount + r.invoiceCount,
        quantity: acc.quantity + r.quantity,
        value: acc.value + r.value,
        saleRevenue: acc.saleRevenue + r.saleRevenue,
        salesTax: acc.salesTax + r.salesTax,
      }),
      { invoiceCount: 0, quantity: 0, value: 0, saleRevenue: 0, salesTax: 0 },
    );

    const cols = [
      { width: 50 },
      { width: 26 },
      { width: 40 },
      { width: 42 },
      { width: 55 },
      { width: 48 },
    ];

    let x = ML;
    for (const col of cols) {
      doc.setFillColor(...C.blue100);
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.2);
      doc.rect(x, y, col.width, ROW_H, 'FD');
      x += col.width;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.slate900);
    x = ML;

    const tVals = [
      'TOTALS',
      totals.invoiceCount.toLocaleString(),
      fmtN(totals.quantity),
      fmtN(totals.value),
      fmtN(totals.saleRevenue),
      fmtN(totals.salesTax),
    ];

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const align = i === 0 ? 'left' : 'right';
      const tx = align === 'right' ? x + col.width - 2 : x + 2;
      doc.text(tVals[i], tx, y + 5, { align });
      x += col.width;
    }

    y += ROW_H;
  };

  // ── Assemble the PDF ────────────────────────────────────────────────────────
  drawMainHeader();
  y = HEADER_H + 6;

  drawTableHeader();
  summary.forEach((row, i) => drawDataRow(row, i));
  drawTotalsRow();

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(p, total);
  }

  doc.save('hs-code-summary.pdf');
}
