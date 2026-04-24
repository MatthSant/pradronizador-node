function getLeftTrimmed(value: string): string {
  return value.replace(/^[\u0000-\u0020]+/, "");
}

function isLegitNegativeNumber(value: string): boolean {
  return /^-\d+(?:[.,]\d+)?$/.test(value);
}

export function escapeCsvCell(value: unknown): string {
  let stringValue = value === null || value === undefined ? "" : String(value);
  const trimmedLeft = getLeftTrimmed(stringValue);

  if (/^[=+@-]/.test(trimmedLeft) && !isLegitNegativeNumber(trimmedLeft)) {
    stringValue = `'${stringValue}`;
  }

  stringValue = stringValue.replace(/"/g, '""');

  return /[",\r\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
}

export function getUnionHeaders(rows: Record<string, unknown>[]): string[] {
  const headers = new Set<string>();

  for (const row of rows) {
    Object.keys(row).forEach((header) => headers.add(header));
  }

  return Array.from(headers);
}

export function createCsvBlob(rows: Record<string, unknown>[]): Blob {
  const headers = getUnionHeaders(rows);
  const chunks: BlobPart[] = ["\uFEFF"];

  chunks.push(headers.map((header) => escapeCsvCell(header)).join(",") + "\r\n");

  for (const row of rows) {
    chunks.push(
      headers.map((header) => escapeCsvCell(row[header])).join(",") + "\r\n"
    );
  }

  return new Blob(chunks, { type: "text/csv;charset=utf-8;" });
}
