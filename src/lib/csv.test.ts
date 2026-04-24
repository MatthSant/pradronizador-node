import { describe, expect, it } from "vitest";

import { createCsvBlob, escapeCsvCell, getUnionHeaders } from "./csv";

async function readBlobText(blob: Blob): Promise<string> {
  return blob.text();
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe("escapeCsvCell", () => {
  it("escapes commas", () => {
    expect(escapeCsvCell("Nome, Sobrenome")).toBe('"Nome, Sobrenome"');
  });

  it("escapes quotes", () => {
    expect(escapeCsvCell('João "Jota"')).toBe('"João ""Jota"""');
  });

  it("escapes line breaks", () => {
    expect(escapeCsvCell("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });

  it("neutralizes formula prefixes", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil.com","click")')).toBe(
      `"\'=HYPERLINK(""http://evil.com"",""click"")"`
    );
    expect(escapeCsvCell("+SUM(1,1)")).toBe(`"'+SUM(1,1)"`);
    expect(escapeCsvCell("@cmd")).toBe(`'@cmd`);
    expect(escapeCsvCell("-cmd")).toBe(`'-cmd`);
  });

  it("neutralizes suspicious values with leading whitespace or controls", () => {
    expect(escapeCsvCell(" -cmd")).toBe(`' -cmd`);
    expect(escapeCsvCell("\t=SUM(1,1)")).toBe(`"'\t=SUM(1,1)"`);
  });

  it("preserves legitimate negative numbers", () => {
    expect(escapeCsvCell("-10")).toBe("-10");
    expect(escapeCsvCell("-10,50")).toBe('"-10,50"');
    expect(escapeCsvCell("-10.50")).toBe("-10.50");
  });
});

describe("getUnionHeaders", () => {
  it("includes columns discovered after the first row", () => {
    expect(
      getUnionHeaders([
        { Nome: "Ana" },
        { Nome: "João", Email: "joao@example.com" },
      ])
    ).toEqual(["Nome", "Email"]);
  });
});

describe("createCsvBlob", () => {
  it("escapes headers and preserves later columns in the CSV output", async () => {
    const blob = createCsvBlob([
      { "Nome,Completo": "Ana" },
      { "Nome,Completo": 'João "Jota"', Email: "joao@example.com" },
    ]);

    const text = await readBlobText(blob);
    const bytes = await readBlobBytes(blob);

    expect(text).toBe(
      '"Nome,Completo",Email\r\nAna,\r\n"João ""Jota""",joao@example.com\r\n'
    );
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("neutralizes formulas in generated CSV rows", async () => {
    const blob = createCsvBlob([{ Campo: "=CMD|' /C calc'!A0" }]);
    const text = await readBlobText(blob);

    expect(text).toContain(`Campo\r\n'=CMD|' /C calc'!A0\r\n`);
  });
});
