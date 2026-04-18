import { TRANS_STATUS_MAP } from "./constants";

export function normalizeString(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function mapStatus(status: string): string {
  const normStatus = status.trim().toLowerCase();
  return TRANS_STATUS_MAP[normStatus] || normStatus;
}
