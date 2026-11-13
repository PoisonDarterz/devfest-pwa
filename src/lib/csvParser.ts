/**
 * Robust CSV Parser & Luma CSV Field Mapper
 * Supports RFC 4180 compliant CSV (quoted fields, commas in quotes, escaped quotes)
 * Adapted for Google DevFest KL 2026 attendee export schema.
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
  phone_number?: string;
  approval_status?: string;
  notes?: string;
}

export interface InvalidCsvRow {
  rowNumber: number;
  reason: string;
  raw: string;
  email?: string;
  name?: string;
  guestId?: string;
  status?: string;
}

export interface CsvParseResult {
  totalRows: number;
  validRows: ParsedWhitelistRow[];
  invalidRows: InvalidCsvRow[];
  detectedColumns: {
    guestId?: string;
    name?: string;
    email?: string;
    qrUrl?: string;
    ticket?: string;
    jobTitle?: string;
    company?: string;
    tshirt?: string;
    approvalStatus?: string;
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
 * Normalizes header strings for flexible matching (case-insensitive, alphanumeric only)
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Maps raw ticket strings to application attendee categories
 */
function normalizeTicketType(rawTicket: string): string {
  const clean = (rawTicket || '').trim();
  if (!clean) return 'Standard Attendee';
  const lower = clean.toLowerCase();
  if (lower === 'standard' || lower === 'standard attendee' || lower === 'standard pass') return 'Standard Attendee';
  if (lower.includes('vip')) return 'VIP Attendee';
  if (lower.includes('walk-in') || lower.includes('walkin')) return 'Walk-in Attendee';
  if (lower.includes('speaker')) return 'Speaker';
  if (lower.includes('organizer') || lower.includes('organiser')) return 'Organizer';
  if (lower.includes('core')) return 'Core Team';
  if (lower.includes('sponsor')) return 'Sponsor';
  return clean;
}

/**
 * Parses Luma attendee CSV text with the updated export headers into typed database-ready whitelist items.
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

  // Column index finder checking candidate names in priority order
  const findIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const norm = normalizeHeader(name);
      const idx = normalizedHeaders.indexOf(norm);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const guestIdIdx = findIndex(['guest_id', 'guestid', 'external_ref_id']);
  const nameIdx = findIndex(['name', 'full_name', 'fullname', 'attendee name']);
  const firstNameIdx = findIndex(['first_name', 'firstname', 'first name']);
  const lastNameIdx = findIndex(['last_name', 'lastname', 'last name']);
  const emailIdx = findIndex(['email', 'attendee email', 'email address']);
  const phoneIdx = findIndex(['phone_number', 'phone', 'phonenumber', 'mobile']);
  const approvalStatusIdx = findIndex(['approval_status', 'approvalstatus', 'status']);
  const qrUrlIdx = findIndex(['qr_code_url', 'qrcodeurl', 'qr_payload', 'qr payload']);
  const ticketIdx = findIndex(['ticket_name', 'ticketname', 'ticket_type_id', 'ticket_type', 'ticket']);
  const jobTitleIdx = findIndex(['job title', 'jobtitle', 'job_title', 'title', 'role']);
  const companyIdx = findIndex(['company / institution', 'company/institution', 'company', 'institution', 'organization']);

  // T-Shirt size matcher (handles full long survey question with emojis and notes)
  let tshirtIdx = findIndex([
    't-shirt size (standard sizing) [other sizes are now out of stock due to a strict timeline, we apologise for the inconveniences caused 🙏]',
    't-shirt size (standard sizing)',
    't-shirt size',
    'tshirtsize',
    'tshirt_size',
    'tshirt',
    'shirt size',
  ]);
  if (tshirtIdx === -1) {
    tshirtIdx = normalizedHeaders.findIndex(
      (h) => h.startsWith('tshirtsize') || h.includes('tshirt') || h.includes('shirtsize')
    );
  }

  const detectedColumns = {
    guestId: guestIdIdx !== -1 ? rawHeaders[guestIdIdx] : undefined,
    name:
      nameIdx !== -1
        ? rawHeaders[nameIdx]
        : firstNameIdx !== -1
        ? `${rawHeaders[firstNameIdx]} + ${rawHeaders[lastNameIdx] || ''}`
        : undefined,
    email: emailIdx !== -1 ? rawHeaders[emailIdx] : undefined,
    qrUrl: qrUrlIdx !== -1 ? rawHeaders[qrUrlIdx] : undefined,
    ticket: ticketIdx !== -1 ? rawHeaders[ticketIdx] : undefined,
    jobTitle: jobTitleIdx !== -1 ? rawHeaders[jobTitleIdx] : undefined,
    company: companyIdx !== -1 ? rawHeaders[companyIdx] : undefined,
    tshirt: tshirtIdx !== -1 ? rawHeaders[tshirtIdx] : undefined,
    approvalStatus: approvalStatusIdx !== -1 ? rawHeaders[approvalStatusIdx] : undefined,
  };

  const validRows: ParsedWhitelistRow[] = [];
  const invalidRows: InvalidCsvRow[] = [];

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const rawLine = row.join(',');

    let fullName = nameIdx !== -1 ? (row[nameIdx] || '').trim() : '';
    if (!fullName && firstNameIdx !== -1) {
      const fn = (row[firstNameIdx] || '').trim();
      const ln = lastNameIdx !== -1 ? (row[lastNameIdx] || '').trim() : '';
      fullName = [fn, ln].filter(Boolean).join(' ');
    }
    const guestId = guestIdIdx !== -1 ? (row[guestIdIdx] || '').trim() : '';

    if (emailIdx === -1) {
      invalidRows.push({
        rowNumber: r + 1,
        reason: 'Header row is missing an "email" column.',
        raw: rawLine,
        name: fullName || undefined,
        guestId: guestId || undefined,
      });
      continue;
    }

    const rawEmail = (row[emailIdx] || '').trim();
    const email = rawEmail.toLowerCase();
    if (!email || !email.includes('@')) {
      invalidRows.push({
        rowNumber: r + 1,
        reason: rawEmail ? `Invalid email address format ("${rawEmail}").` : 'Missing email address.',
        raw: rawLine,
        email: rawEmail || undefined,
        name: fullName || undefined,
        guestId: guestId || undefined,
      });
      continue;
    }

    // Skip registrations that were declined, rejected, or cancelled
    const approvalStatus = approvalStatusIdx !== -1 ? (row[approvalStatusIdx] || '').trim().toLowerCase() : '';
    if (approvalStatus === 'declined' || approvalStatus === 'cancelled' || approvalStatus === 'rejected') {
      invalidRows.push({
        rowNumber: r + 1,
        reason: `Registration status is "${approvalStatus}" (not approved).`,
        raw: rawLine,
        email: email || undefined,
        name: fullName || undefined,
        guestId: guestId || undefined,
        status: approvalStatus,
      });
      continue;
    }

    const externalRefId = guestId;
    const qrPayload = qrUrlIdx !== -1 ? (row[qrUrlIdx] || '').trim() : '';
    const rawTicket = ticketIdx !== -1 ? (row[ticketIdx] || '').trim() : '';
    const ticketType = normalizeTicketType(rawTicket);
    const jobTitle = jobTitleIdx !== -1 ? (row[jobTitleIdx] || '').trim() : '';
    const company = companyIdx !== -1 ? (row[companyIdx] || '').trim() : '';
    const tshirtSize = tshirtIdx !== -1 ? (row[tshirtIdx] || '').trim() : '';
    const phone = phoneIdx !== -1 ? (row[phoneIdx] || '').trim() : '';

    validRows.push({
      email,
      full_name: fullName || undefined,
      external_ref_id: externalRefId || undefined,
      qr_payload: qrPayload || undefined,
      ticket_type: ticketType,
      job_title: jobTitle || undefined,
      company: company || undefined,
      tshirt_size: tshirtSize || undefined,
      phone_number: phone || undefined,
      approval_status: approvalStatus || undefined,
      notes: phone ? `Phone: ${phone}` : 'Imported via Luma CSV',
    });
  }

  return {
    totalRows: grid.length - 1,
    validRows,
    invalidRows,
    detectedColumns,
  };
}
