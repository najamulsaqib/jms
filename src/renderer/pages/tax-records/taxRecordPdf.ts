import { jsPDF } from 'jspdf';
import { TaxRecord } from '@shared/taxRecord.contracts';

// ── Company details ── Change these to update all PDFs ────────────────────────
export const PDF_COMPANY_INFO = {
  name: 'JMS Tax Consultancy',
  tagline: 'Professional Tax & Financial Services',
  address: 'Bhatti Market, Katchehry Road, Lalian, Pakistan',
  phone: '+92 342 0752602',
  contactName: 'Umair Danish',
};
// ─────────────────────────────────────────────────────────────────────────────

export type PdfField =
  | 'name'
  | 'referenceNumber'
  | 'cnic'
  | 'email'
  | 'password'
  | 'reference'
  | 'status'
  | 'notes'
  | 'createdAt'
  | 'updatedAt';

export type PdfFieldOption = {
  id: PdfField;
  label: string;
  defaultChecked: boolean;
  section: string;
};

export const PDF_FIELD_OPTIONS: PdfFieldOption[] = [
  {
    id: 'referenceNumber',
    label: 'Reference Number',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'name',
    label: 'Full Name',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'cnic',
    label: 'CNIC',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'reference',
    label: 'Reference',
    defaultChecked: false,
    section: 'Personal Information',
  },
  {
    id: 'email',
    label: 'Email Address',
    defaultChecked: true,
    section: 'Account Credentials',
  },
  {
    id: 'password',
    label: 'Password',
    defaultChecked: false,
    section: 'Account Credentials',
  },
  {
    id: 'status',
    label: 'Status',
    defaultChecked: true,
    section: 'Status & Dates',
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    defaultChecked: false,
    section: 'Status & Dates',
  },
  {
    id: 'updatedAt',
    label: 'Last Modified',
    defaultChecked: false,
    section: 'Status & Dates',
  },
  {
    id: 'notes',
    label: 'Notes',
    defaultChecked: true,
    section: 'Additional Notes',
  },
];

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
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18; // margin left
const MR = 18; // margin right
const CW = PAGE_W - ML - MR; // content width
const LABEL_COL_W = CW * 0.38;
const HEADER_H = 44; // main header height (first page)
const CONT_HDR_H = 14; // continuation header height (subsequent pages)
const FOOTER_H = 22; // footer height reserved at bottom
const ROW_H = 9;
const SECTION_H = 7.5;
const GAP = 6; // space between sections

// Safe bottom boundary before the footer starts
const SAFE_BOTTOM = PAGE_H - FOOTER_H - 4;

export function generateTaxRecordPdf(
  record: TaxRecord,
  selectedFields: Set<PdfField>,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const genDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── Draw full header (first page only) ─────────────────────────────────────
  const drawMainHeader = () => {
    // Blue background
    doc.setFillColor(...C.blue600);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

    // Darker accent strip at base
    doc.setFillColor(...C.blue800);
    doc.rect(0, HEADER_H - 1, PAGE_W, 1, 'F');

    // Company name
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(PDF_COMPANY_INFO.name, ML, 16);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.blue100);
    doc.text(PDF_COMPANY_INFO.tagline, ML, 24);

    // Generated date (top-right)
    doc.setFontSize(8);
    doc.text(`Generated: ${genDate}`, PAGE_W - MR, 16, { align: 'right' });

    // Record name + ref# (bottom bar)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...C.white);
    doc.text(record.name, ML, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Ref# ${record.referenceNumber}`, PAGE_W - MR, 38, {
      align: 'right',
    });
  };

  // ── Draw slim continuation header (subsequent pages) ───────────────────────
  const drawContinuationHeader = () => {
    doc.setFillColor(...C.blue600);
    doc.rect(0, 0, PAGE_W, CONT_HDR_H, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${PDF_COMPANY_INFO.name} — Tax Record (continued)`, ML, 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.blue100);
    doc.text(record.name, PAGE_W - MR, 9.5, { align: 'right' });
  };

  // ── Draw footer on a specific page ─────────────────────────────────────────
  const drawFooter = (pageNum: number, totalPages: number) => {
    const fy = PAGE_H - FOOTER_H;

    // Divider line
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.4);
    doc.line(ML, fy, PAGE_W - MR, fy);

    // Top row: company name + page number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.blue600);
    doc.text(PDF_COMPANY_INFO.name, ML, fy + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.slate400);
    doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MR, fy + 6, {
      align: 'right',
    });

    // Thin separator
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.2);
    doc.line(ML, fy + 8.5, PAGE_W - MR, fy + 8.5);

    // Bottom row: address | phone | email | website
    doc.setFontSize(7.5);
    doc.setTextColor(...C.slate600);
    doc.text(
      `${PDF_COMPANY_INFO.contactName}  •  ${PDF_COMPANY_INFO.phone}`,
      ML,
      fy + 13.5,
    );

    doc.text(PDF_COMPANY_INFO.address, PAGE_W - MR, fy + 13.5, {
      align: 'right',
    });

    // Confidential badge
    doc.setFontSize(7);
    doc.setTextColor(...C.slate400);
    doc.text('Confidential Document', ML, fy + 19);
    doc.text(`Generated: ${genDate}`, PAGE_W - MR, fy + 19, { align: 'right' });
  };

  // ── Page management ─────────────────────────────────────────────────────────
  let currentPage = 1;
  let y = HEADER_H + 12; // start below main header

  drawMainHeader();

  const addPage = () => {
    doc.addPage();
    currentPage++;
    drawContinuationHeader();
    y = CONT_HDR_H + 8;
  };

  // Check if `needed` mm fits before the footer; add page if not
  const ensureSpace = (needed: number) => {
    if (y + needed > SAFE_BOTTOM) {
      addPage();
    }
  };

  // ── Drawing helpers ─────────────────────────────────────────────────────────
  const drawSectionHeader = (title: string) => {
    ensureSpace(SECTION_H + ROW_H); // at least one row after header

    doc.setFillColor(...C.slate50);
    doc.rect(ML, y, CW, SECTION_H, 'F');

    // Blue left accent
    doc.setFillColor(...C.blue600);
    doc.rect(ML, y, 3, SECTION_H, 'F');

    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.25);
    doc.rect(ML, y, CW, SECTION_H, 'S');

    doc.setTextColor(...C.blue600);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title.toUpperCase(), ML + 7, y + 5);

    y += SECTION_H + 2;
  };

  const drawRow = (label: string, value: string, shade: boolean) => {
    ensureSpace(ROW_H);

    if (shade) {
      doc.setFillColor(...C.rowAlt);
      doc.rect(ML, y, CW, ROW_H, 'F');
    }

    // Row bottom border
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.15);
    doc.line(ML, y + ROW_H, ML + CW, y + ROW_H);

    // Label
    doc.setTextColor(...C.slate400);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(label, ML + 5, y + 6);

    // Vertical divider between label and value
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.2);
    doc.line(ML + LABEL_COL_W, y, ML + LABEL_COL_W, y + ROW_H);

    // Value
    doc.setTextColor(...C.slate900);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', ML + LABEL_COL_W + 5, y + 6, {
      maxWidth: CW - LABEL_COL_W - 8,
    });

    y += ROW_H;
  };

  const drawNotesBlock = (notes: string) => {
    const maxW = CW - 10;
    const lines = doc.splitTextToSize(notes, maxW) as string[];
    const lineH = 5.5;
    const topPad = 7;
    const botPad = 4;

    // Only ensure enough room to start (1 line + padding) — don't jump the whole block
    ensureSpace(topPad + lineH + botPad);

    let i = 0;
    while (i < lines.length) {
      const segStart = y;
      const availH = SAFE_BOTTOM - segStart;

      // How many lines fit in the remaining space on this page
      const maxLines = Math.max(
        1,
        Math.floor((availH - topPad - botPad) / lineH),
      );
      const segLines = lines.slice(i, i + maxLines);
      const segH = Math.max(18, topPad + segLines.length * lineH + botPad);

      // Background + border for this segment
      doc.setFillColor(...C.slate50);
      doc.rect(ML, segStart, CW, segH, 'F');
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.25);
      doc.rect(ML, segStart, CW, segH, 'S');

      // Text for this segment
      doc.setTextColor(...C.slate600);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      let lineY = segStart + topPad;
      for (const line of segLines) {
        doc.text(line, ML + 5, lineY);
        lineY += lineH;
      }

      y = segStart + segH;
      i += segLines.length;

      if (i < lines.length) {
        addPage();
      }
    }
  };

  // ── Assemble sections ───────────────────────────────────────────────────────

  // Personal Information
  const personalFields: { label: string; value: string }[] = [];
  if (selectedFields.has('referenceNumber'))
    personalFields.push({
      label: 'Reference Number',
      value: record.referenceNumber,
    });
  if (selectedFields.has('name'))
    personalFields.push({ label: 'Full Name', value: record.name });
  if (selectedFields.has('cnic'))
    personalFields.push({ label: 'CNIC', value: record.cnic });
  if (selectedFields.has('reference'))
    personalFields.push({
      label: 'Reference',
      value: record.reference.replace(/-/g, ' '),
    });

  if (personalFields.length > 0) {
    drawSectionHeader('Personal Information');
    personalFields.forEach((f, i) => drawRow(f.label, f.value, i % 2 === 0));
    y += GAP;
  }

  // Account Credentials
  const credFields: { label: string; value: string }[] = [];
  if (selectedFields.has('email'))
    credFields.push({ label: 'Email Address', value: record.email });
  if (selectedFields.has('password'))
    credFields.push({ label: 'Password', value: record.password });

  if (credFields.length > 0) {
    drawSectionHeader('Account Credentials');
    credFields.forEach((f, i) => drawRow(f.label, f.value, i % 2 === 0));
    y += GAP;
  }

  // Status & Dates
  const metaFields: { label: string; value: string }[] = [];
  if (selectedFields.has('status')) {
    const statusLabel =
      record.status === 'active'
        ? 'Active'
        : record.status === 'inactive'
          ? 'Inactive'
          : 'Late Filer';
    metaFields.push({ label: 'Status', value: statusLabel });
  }
  if (selectedFields.has('createdAt')) {
    metaFields.push({
      label: 'Created Date',
      value: new Date(record.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });
  }
  if (selectedFields.has('updatedAt')) {
    metaFields.push({
      label: 'Last Modified',
      value: new Date(record.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });
  }

  if (metaFields.length > 0) {
    drawSectionHeader('Status & Dates');
    metaFields.forEach((f, i) => drawRow(f.label, f.value, i % 2 === 0));
    y += GAP;
  }

  // Notes
  if (selectedFields.has('notes') && record.notes?.trim()) {
    drawSectionHeader('Additional Notes');
    drawNotesBlock(record.notes);
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const safeName = record.name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
  doc.save(`${safeName}-tax-record.pdf`);
}
