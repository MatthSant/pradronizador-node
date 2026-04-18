import { TRANS_STATUS_MAP } from "./constants";

/**
 * Normalizes a string for fuzzy matching: 
 * Removes accents, non-alphanumeric chars, and converts to lowercase.
 */
export function normalizeString(s: string): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Cleans surrogates and replaces invalid UTF-8 characters.
 */
export function cleanSurrogates(s: any): any {
  if (typeof s !== "string") return s;
  return s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (match) => {
    // Keep valid surrogates, or replace if they are truly broken
    return match; 
  }).replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u0180-\u024F]/g, " ");
}

export function cleanEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase().replace(/\s/g, "");
}

export function mapStatus(status: string): string {
  if (!status) return "";
  const normStatus = status.trim().toLowerCase();
  return TRANS_STATUS_MAP[normStatus] || normStatus;
}

/**
 * Normalizes various date formats into Postgres-compatible YYYY-MM-DD HH:mm:ss.
 * Handles DD/MM/YYYY, YYYY-MM-DD, and variants.
 */
/**
 * Normalizes various date formats into Postgres-compatible YYYY-MM-DD HH:mm:ss.
 * Handles DD/MM/YYYY, YYYY-MM-DD, and native Date objects.
 */
export function normalizeDate(dateVal: any): string {
  if (!dateVal) return "";

  // 1. Handle Native Date Objects directly to preserve time
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return "";
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    const hh = String(dateVal.getHours()).padStart(2, '0');
    const mm = String(dateVal.getMinutes()).padStart(2, '0');
    const ss = String(dateVal.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  const s = String(dateVal).trim();
  if (!s) return "";

  // 2. ISO-ish format (YYYY-MM-DD)
  // Matches: 2024-03-21, 2024-03-21 15:30, 2024-03-21 15:30:45
  const isoMatch = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const [_, y, m, d, hh = "00", mm = "00", ss = "00"] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${hh}:${mm}:${ss}`;
  }

  // 3. BR format (DD/MM/YYYY)
  // Matches: 21/03/2024, 21/03/2024 15:30
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (brMatch) {
    const [_, d, m, y, hh = "00", mm = "00", ss = "00"] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${hh}:${mm}:${ss}`;
  }

  // 4. Fallback: Native Date parsing
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
    }
  } catch (e) {}

  return s; 
}
