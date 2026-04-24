import { File as NodeFile } from "node:buffer";

import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";
import Papa from "papaparse";

import { discoverUniqueStatuses, extractFileHeaders, processFiles } from "./processor";

function createCsvFile(content: string, name: string): File {
  return new NodeFile([content], name, { type: "text/csv" }) as unknown as File;
}

function createXlsxFile(rows: unknown[][], name: string): File {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  return new NodeFile(
    [XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })],
    name,
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  ) as unknown as File;
}

describe("extractFileHeaders", () => {
  it("preserves duplicate CSV headers and samples with unique names", async () => {
    const file = createCsvFile(
      "Email,Email,Nome\nprimeiro@example.com,segundo@example.com,Ana",
      "duplicado.csv"
    );

    const metadata = await extractFileHeaders([file]);

    expect(metadata["duplicado.csv"].headers).toEqual(["Email", "Email_2", "Nome"]);
    expect(metadata["duplicado.csv"].samples).toEqual({
      Email: ["primeiro@example.com"],
      Email_2: ["segundo@example.com"],
      Nome: ["Ana"],
    });
  });

  it("preserves duplicate XLSX headers and samples with unique names", async () => {
    const file = createXlsxFile(
      [["Email", "Email", "Nome"], ["primeiro@example.com", "segundo@example.com", "Ana"]],
      "duplicado.xlsx"
    );

    const metadata = await extractFileHeaders([file]);

    expect(metadata["duplicado.xlsx"].headers).toEqual(["Email", "Email_2", "Nome"]);
    expect(metadata["duplicado.xlsx"].samples).toEqual({
      Email: ["primeiro@example.com"],
      Email_2: ["segundo@example.com"],
      Nome: ["Ana"],
    });
  });
});

describe("processFiles", () => {
  it("uses the same unique CSV headers from preview in final processing", async () => {
    const file = createCsvFile(
      "Email,Email,Nome\nPrimeiro@Example.com,segundo valor,Ana",
      "preview-e-processamento.csv"
    );
    const metadata = await extractFileHeaders([file]);
    const headers = metadata["preview-e-processamento.csv"].headers;

    const result = await processFiles(
      [file],
      {
        "preview-e-processamento.csv": {
          [headers[0]]: "field_email",
          [headers[1]]: "field_name",
        },
      },
      { "preview-e-processamento.csv": {} },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_email: "primeiro@example.com",
        field_name: "segundo valor",
        idform: "preview-e-processamento.csv",
      },
    ]);
  });

  it("preserves duplicate XLSX headers in final processing", async () => {
    const file = createXlsxFile(
      [["Email", "Email", "Nome"], ["Primeiro@Example.com", "segundo valor", "Ana"]],
      "duplicado.xlsx"
    );

    const result = await processFiles(
      [file],
      {
        "duplicado.xlsx": {
          Email: "field_email",
          Email_2: "field_name",
        },
      },
      { "duplicado.xlsx": {} },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_email: "primeiro@example.com",
        field_name: "segundo valor",
        idform: "duplicado.xlsx",
      },
    ]);
  });
});

describe("discoverUniqueStatuses", () => {
  it("uses the same unique headers when scanning statuses", async () => {
    const file = createCsvFile(
      "Status,Status\npendente,aprovado\ncancelado,reembolsado",
      "status.csv"
    );

    const result = await discoverUniqueStatuses(
      [file],
      {
        "status.csv": {
          Status_2: "field_transaction_status",
        },
      },
      "transactions"
    );

    expect(result.statuses).toEqual(["aprovado", "reembolsado"]);
    expect(result.warnings).toEqual([]);
  });

  it("stops scanning and returns a warning after the configured row limit", async () => {
    const rows = Array.from({ length: 5001 }, (_, index) => `pendente_${index % 2}`);
    const file = createCsvFile(
      `Status\n${rows.join("\n")}`,
      "status-limit.csv"
    );

    const result = await discoverUniqueStatuses(
      [file],
      {
        "status-limit.csv": {
          Status: "field_transaction_status",
        },
      },
      "transactions"
    );

    expect(result.statuses).toEqual(["pendente_0", "pendente_1"]);
    expect(result.warnings).toEqual([
      {
        fileName: "status-limit.csv",
        code: "STATUS_SCAN_LIMIT",
        message: "A coleta de status foi interrompida após 5000 linhas analisadas.",
      },
    ]);
  });
});

describe("parser hardening", () => {
  it("does not hang when PapaParse reports an error during header extraction", async () => {
    const parseSpy = vi.spyOn(Papa, "parse").mockImplementation((_, config) => {
      config?.error?.(new Error("csv parse failed"), "" as never, null);
      return {} as Papa.Parser;
    });

    const metadata = await extractFileHeaders([createCsvFile("qualquer", "erro.csv")]);

    expect(metadata["erro.csv"]).toEqual({ headers: [], samples: {} });
    parseSpy.mockRestore();
  });
});
