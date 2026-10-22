/**
 * Robust CSV Parser & Luma CSV Field Mapper
 * Supports RFC 4180 compliant CSV (quoted fields, commas in quotes, escaped quotes)
 */

export interface ParsedWhitelistRow {
  email: string;
  full_name?: string;
  external_ref_id?: string;
  qr_payload?: string;
  ticket_type?: string;
  job_title?: string;
  company?: string;
  tshirt_size?: string;
  notes?: string;
}

export interface CsvParseResult {
  totalRows: number;
  validRows: ParsedWhitelistRow[];
  invalidRows: { rowNumber: number; reason: string; raw: string }[];
  detectedColumns: {
    email?: string;
    name?: string;
    guestId?: string;
    qrUrl?: string;
    ticket?: string;
    jobTitle?: string;
    company?: string;
    tshirt?: string;
  };
}

/**
 * Splits raw CSV text into a 2D array of cells [row][col] handling quotes and escapes.
 */
export function parseCsvToGrid(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header strings for flexible fuzzy matching
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parses Luma (or generic attendee) CSV text into typed database-ready whitelist items.
 */
export function parseLumaCsv(csvText: string): CsvParseResult {
  const grid = parseCsvToGrid(csvText);

  if (grid.length === 0) {
    return {
      totalRows: 0,
      validRows: [],
      invalidRows: [],
      detectedColumns: {},
    };
  }

  const rawHeaders = grid[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Column index finders
  const findIndex = (possibleNames: string[]): number => {
    const normPossible = possibleNames.map(normalizeHeader);
    return normalizedHeaders.findIndex((h) => normPossible.includes(h));
  };

  const emailIdx = findIndex(['email', 'e-mail', 'mail', 'attendee email', 'email address']);
  const nameIdx = findIndex(['name', 'full_name', 'fullname', 'attendee name', 'guest name']);
  const firstNameIdx = findIndex(['first_name', 'firstname', 'first name']);
  const lastNameIdx = findIndex(['last_name', 'lastname', 'last name']);
  const guestIdIdx = findIndex(['guest_id', 'guestid', 'external_ref_id', 'ticket_id', 'id']);
  const qrUrlIdx = findIndex(['qr_code_url', 'qrcodeurl', 'qr_payload', 'qr payload', 'qr_code']);
  const ticketIdx = findIndex(['ticket_name', 'ticketname', 'ticket_type', 'ticket', 'ticket type']);
  const jobTitleIdx = findIndex(['job title', 'jobtitle', 'job_title', 'title', 'role']);
  const companyIdx = findIndex(['company / institution', 'company/institution', 'company', 'institution', 'organization']);
  const tshirtIdx = findIndex(['t-shirt size (standard sizing)', 't-shirt size', 'tshirtsize', 'tshirt_size', 'tshirt', 'shirt size']);

  const detectedColumns = {
    email: emailIdx !== -1 ? rawHeaders[emailIdx] : undefined,
    name: nameIdx !== -1 ? rawHeaders[nameIdx] : (firstNameIdx !== -1 ? `${rawHeaders[firstNameIdx]} + ${rawHeaders[lastNameIdx] || ''}` : undefined),
    guestId: guestIdIdx !== -1 ? rawHeaders[guestIdIdx] : undefined,
    qrUrl: qrUrlIdx !== -1 ? rawHeaders[qrUrlIdx] : undefined,
    ticket: ticketIdx !== -1 ? rawHeaders[ticketIdx] : undefined,
    jobTitle: jobTitleIdx !== -1 ? rawHeaders[jobTitleIdx] : undefined,
    company: companyIdx !== -1 ? rawHeaders[companyIdx] : undefined,
    tshirt: tshirtIdx !== -1 ? rawHeaders[tshirtIdx] : undefined,
  };

  const validRows: ParsedWhitelistRow[] = [];
  const invalidRows: { rowNumber: number; reason: string; raw: string }[] = [];

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const rawLine = row.join(',');

    if (emailIdx === -1) {
      invalidRows.push({
        rowNumber: r + 1,
        reason: 'Header row is missing an "email" column.',
        raw: rawLine,
      });
      continue;
    }

    const email = (row[emailIdx] || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      invalidRows.push({
        rowNumber: r + 1,
        reason: 'Missing or invalid email address.',
        raw: rawLine,
      });
      continue;
    }

    let fullName = nameIdx !== -1 ? (row[nameIdx] || '').trim() : '';
    if (!fullName && firstNameIdx !== -1) {
      const fn = (row[firstNameIdx] || '').trim();
      const ln = lastNameIdx !== -1 ? (row[lastNameIdx] || '').trim() : '';
      fullName = [fn, ln].filter(Boolean).join(' ');
    }

    const externalRefId = guestIdIdx !== -1 ? (row[guestIdIdx] || '').trim() : '';
    const qrPayload = qrUrlIdx !== -1 ? (row[qrUrlIdx] || '').trim() : '';
    const ticketType = (ticketIdx !== -1 ? (row[ticketIdx] || '').trim() : '') || 'Standard Attendee';
    const jobTitle = jobTitleIdx !== -1 ? (row[jobTitleIdx] || '').trim() : '';
    const company = companyIdx !== -1 ? (row[companyIdx] || '').trim() : '';
    const tshirtSize = tshirtIdx !== -1 ? (row[tshirtIdx] || '').trim() : '';

    validRows.push({
      email,
      full_name: fullName || undefined,
      external_ref_id: externalRefId || undefined,
      qr_payload: qrPayload || undefined,
      ticket_type: ticketType,
      job_title: jobTitle || undefined,
      company: company || undefined,
      tshirt_size: tshirtSize || undefined,
      notes: 'Imported via Luma CSV',
    });
  }

  return {
    totalRows: grid.length - 1,
    validRows,
    invalidRows,
    detectedColumns,
  };
}
