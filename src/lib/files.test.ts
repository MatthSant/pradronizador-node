import { File as NodeFile } from "node:buffer";

import { describe, expect, it } from "vitest";

import { getFileKey } from "./files";

function createCsvFile(content: string, name: string): File {
  return new NodeFile([content], name, { type: "text/csv" }) as unknown as File;
}

describe("getFileKey", () => {
  it("returns the same key for the same File instance", () => {
    const file = createCsvFile("Nome\nAna", "dados.csv");

    expect(getFileKey(file)).toBe(getFileKey(file));
  });

  it("returns different keys for different files with the same name", () => {
    const firstFile = createCsvFile("Nome\nAna", "dados.csv");
    const secondFile = createCsvFile("Nome\nBruno", "dados.csv");

    expect(getFileKey(firstFile)).not.toBe(getFileKey(secondFile));
  });
});
