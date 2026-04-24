const fileKeyStore = new WeakMap<File, string>();
let fileKeySeq = 0;

export function getFileKey(file: File): string {
  const existing = fileKeyStore.get(file);

  if (existing) {
    return existing;
  }

  fileKeySeq += 1;
  const next = `file_${fileKeySeq}`;

  fileKeyStore.set(file, next);

  return next;
}
