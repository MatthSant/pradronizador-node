export function makeUniqueHeaders(headers: unknown[]): string[] {
  const counts = new Map<string, number>();

  return headers.map((header, index) => {
    const fallback = `Coluna_${index + 1}`;
    const base = String(header ?? fallback).trim() || fallback;
    const current = counts.get(base) ?? 0;

    counts.set(base, current + 1);

    return current === 0 ? base : `${base}_${current + 1}`;
  });
}
