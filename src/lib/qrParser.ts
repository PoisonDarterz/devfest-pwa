/**
 * QR Parser and Attendee Identifier Extractor
 * Handles Luma URLs, AnnexHub Badge IDs, and direct ticket keys.
 */

export interface ParsedAttendeeKey {
  raw: string;
  cleanKey: string;
  pk?: string;
  eventId?: string;
  isLumaUrl: boolean;
  email?: string;
}

/**
 * Parses any scanned QR payload or NFC text to extract the unique attendee key.
 * 
 * Supports:
 * - Full Luma Check-in URLs: https://luma.com/check-in/evt-...?pk=qgbP7Ial653qHmL
 * - Shorter Luma URLs: https://lu.ma/check-in/evt-...?pk=g-nIkeAve49hpxoQH
 * - Raw ticket keys / Guest keys: "qgbP7Ial653qHmL", "gst-auuQTTSMZ4kELVH"
 * - JSON strings: {"pk": "...", "email": "..."}
 * - Direct email addresses: "user@example.com"
 */
export function parseAttendeeIdentifier(rawText?: string | null): ParsedAttendeeKey {
  if (!rawText || typeof rawText !== 'string') {
    return { raw: '', cleanKey: '', isLumaUrl: false };
  }

  const clean = rawText.trim();

  // 1. Check if payload is a URL (Luma / AnnexHub check-in URL)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const url = new URL(clean);
      const pk = url.searchParams.get('pk')?.trim();
      const ticketParam = (url.searchParams.get('ticket') || url.searchParams.get('id'))?.trim();
      
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      const eventId = pathSegments.find((seg) => seg.startsWith('evt-'));

      const isLumaUrl = url.hostname.includes('luma.com') || url.hostname.includes('lu.ma');
      const cleanKey = pk || ticketParam || (isLumaUrl ? lastSegment : clean);

      return {
        raw: clean,
        cleanKey: cleanKey || clean,
        pk: pk || undefined,
        eventId: eventId || undefined,
        isLumaUrl,
      };
    } catch {
      // If URL parsing fails, fallback to string treatment
    }
  }

  // 2. Check if payload is a JSON string
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      const key = parsed.pk || parsed.ticket || parsed.guestId || parsed.id || parsed.email || clean;
      return {
        raw: clean,
        cleanKey: String(key).trim(),
        pk: parsed.pk || undefined,
        isLumaUrl: false,
        email: parsed.email?.trim()?.toLowerCase(),
      };
    } catch {}
  }

  // 3. Check if payload is an email address
  if (clean.includes('@') && !clean.includes('/')) {
    const emailCandidate = clean.toLowerCase();
    return {
      raw: clean,
      cleanKey: emailCandidate,
      isLumaUrl: false,
      email: emailCandidate,
    };
  }

  // 4. Raw key (e.g. "qgbP7Ial653qHmL" or "gst-auuQTTSMZ4kELVH" or "DEVFEST-...")
  return {
    raw: clean,
    cleanKey: clean,
    isLumaUrl: false,
  };
}
