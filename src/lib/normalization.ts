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
