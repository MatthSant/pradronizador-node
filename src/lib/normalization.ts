import { TRANS_STATUS_MAP } from "./constants";

const EMOJI_REGEX =
  /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[#*0-9]\uFE0F?\u20E3)/gu;

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

export function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;

  return value
    .replace(/^\uFEFF/, "")
    .replace(EMOJI_REGEX, " ")
    .replace(/[\uFE0E\uFE0F\u200D]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const cleanSurrogates = sanitizeText;

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
 * Handles DD/MM/YYYY, YYYY-MM-DD, and native Date objects.
 */
function formatDateTimeParts(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0
): string {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidTimeParts(hours: number, minutes: number, seconds: number): boolean {
  return (
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59 &&
    seconds >= 0 &&
    seconds <= 59
  );
}

export function normalizeDate(dateVal: unknown): string {
  if (!dateVal) return "";

  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return "";

    return formatDateTimeParts(
      dateVal.getFullYear(),
      dateVal.getMonth() + 1,
      dateVal.getDate(),
      dateVal.getHours(),
      dateVal.getMinutes(),
      dateVal.getSeconds()
    );
  }

  const value = String(dateVal).trim();
  if (!value) return "";

  const isoMatch = value.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (isoMatch) {
    const [, yearRaw, monthRaw, dayRaw, hoursRaw = "00", minutesRaw = "00", secondsRaw = "00"] =
      isoMatch;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    const seconds = Number(secondsRaw);

    if (!isValidDateParts(year, month, day) || !isValidTimeParts(hours, minutes, seconds)) {
      return "";
    }

    return formatDateTimeParts(year, month, day, hours, minutes, seconds);
  }

  const brMatch = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (brMatch) {
    const [, dayRaw, monthRaw, yearRaw, hoursRaw = "00", minutesRaw = "00", secondsRaw = "00"] =
      brMatch;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    const seconds = Number(secondsRaw);

    if (!isValidDateParts(year, month, day) || !isValidTimeParts(hours, minutes, seconds)) {
      return "";
    }

    return formatDateTimeParts(year, month, day, hours, minutes, seconds);
  }

  return "";
}
