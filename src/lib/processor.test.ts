import { File as NodeFile } from "node:buffer";

import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";
import Papa from "papaparse";

import { getFileKey } from "./files";
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

    const result = await extractFileHeaders([file]);
    const fileKey = getFileKey(file);

    expect(result.metadata[fileKey].headers).toEqual(["Email", "Email_2", "Nome"]);
    expect(result.metadata[fileKey].samples).toEqual({
      Email: ["primeiro@example.com"],
      Email_2: ["segundo@example.com"],
      Nome: ["Ana"],
    });
    expect(result.errors).toEqual([]);
  });

  it("preserves duplicate XLSX headers and samples with unique names", async () => {
    const file = createXlsxFile(
      [["Email", "Email", "Nome"], ["primeiro@example.com", "segundo@example.com", "Ana"]],
      "duplicado.xlsx"
    );

    const result = await extractFileHeaders([file]);
    const fileKey = getFileKey(file);

    expect(result.metadata[fileKey].headers).toEqual(["Email", "Email_2", "Nome"]);
    expect(result.metadata[fileKey].samples).toEqual({
      Email: ["primeiro@example.com"],
      Email_2: ["segundo@example.com"],
      Nome: ["Ana"],
    });
    expect(result.errors).toEqual([]);
  });
});

describe("processFiles", () => {
  it("uses the same unique CSV headers from preview in final processing", async () => {
    const file = createCsvFile(
      "Email,Email,Nome\nPrimeiro@Example.com,segundo valor,Ana",
      "preview-e-processamento.csv"
    );
    const metadata = await extractFileHeaders([file]);
    const fileKey = getFileKey(file);
    const headers = metadata.metadata[fileKey].headers;

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          [headers[0]]: "field_email",
          [headers[1]]: "field_name",
        },
      },
      { [fileKey]: {} },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_email: "primeiro@example.com",
        field_name: "segundo valor",
        idform: "preview-e-processamento.csv",
      },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("preserves duplicate XLSX headers in final processing", async () => {
    const file = createXlsxFile(
      [["Email", "Email", "Nome"], ["Primeiro@Example.com", "segundo valor", "Ana"]],
      "duplicado.xlsx"
    );
    const fileKey = getFileKey(file);

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          Email: "field_email",
          Email_2: "field_name",
        },
      },
      { [fileKey]: {} },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_email: "primeiro@example.com",
        field_name: "segundo valor",
        idform: "duplicado.xlsx",
      },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps mappings and fixed values isolated for files with the same name", async () => {
    const firstFile = createCsvFile("Nome\nAna", "dados.csv");
    const secondFile = createCsvFile("Nome\nBruno", "dados.csv");
    const firstFileKey = getFileKey(firstFile);
    const secondFileKey = getFileKey(secondFile);

    const result = await processFiles(
      [firstFile, secondFile],
      {
        [firstFileKey]: { Nome: "field_name" },
        [secondFileKey]: {},
      },
      {
        [firstFileKey]: { field_source: "arquivo_1" },
        [secondFileKey]: { field_source: "arquivo_2" },
      },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_name: "Ana",
        field_source: "arquivo_1",
        idform: "dados.csv",
      },
      {
        field_source: "arquivo_2",
        idform: "dados.csv",
      },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("records invalid dates and uses the next valid normalized source", async () => {
    const file = createCsvFile(
      "Data Inicial,Data Final\n31/02/2024,21/03/2024",
      "datas.csv"
    );
    const fileKey = getFileKey(file);

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          "Data Inicial": "data",
          "Data Final": "data",
        },
      },
      { [fileKey]: {} },
      "transactions"
    );

    expect(result.data).toEqual([
      {
        data: "2024-03-21 00:00:00",
        idform: "datas.csv",
      },
    ]);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        fileName: "datas.csv",
        code: "INVALID_DATE",
        row: 2,
        column: "Data Inicial",
        rawValue: "31/02/2024",
      }),
    ]);
  });

  it("ignores a source emptied by normalization and keeps the next valid value", async () => {
    const file = createCsvFile(
      "Nome 1,Nome 2\n🔥,João Ávila",
      "nomes.csv"
    );
    const fileKey = getFileKey(file);

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          "Nome 1": "field_name",
          "Nome 2": "field_name",
        },
      },
      { [fileKey]: {} },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_name: "João Ávila",
        idform: "nomes.csv",
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("records mapping conflicts and keeps the first normalized value", async () => {
    const file = createCsvFile(
      "Nome Principal,Nome Secundário\nAna,Maria",
      "conflito.csv"
    );
    const fileKey = getFileKey(file);

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          "Nome Principal": "field_name",
          "Nome Secundário": "field_name",
        },
      },
      { [fileKey]: {} },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_name: "Ana",
        idform: "conflito.csv",
      },
    ]);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        fileName: "conflito.csv",
        code: "MAPPING_CONFLICT",
        row: 2,
        column: "field_name",
        rawValue: "Nome Principal=Ana | Nome Secundário=Maria",
      }),
    ]);
  });

  it("records file read errors instead of failing silently", async () => {
    const file = createCsvFile("Nome\nAna", "erro.csv");
    const fileKey = getFileKey(file);
    const parseSpy = vi.spyOn(Papa, "parse").mockImplementation((_, config) => {
      config?.error?.(new Error("csv parse failed"), "" as never, null);
      return {} as Papa.Parser;
    });

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          Nome: "field_name",
        },
      },
      { [fileKey]: {} },
      "events"
    );

    expect(result.data).toEqual([]);
    expect(result.errors).toEqual([
      expect.objectContaining({
        fileName: "erro.csv",
        code: "CSV_PARSE_ERROR",
        message: "csv parse failed",
      }),
    ]);

    parseSpy.mockRestore();
  });

  it("does not overwrite a legitimate zero with a fixed value", async () => {
    const file = createCsvFile("Quantidade\n0", "zero.csv");
    const fileKey = getFileKey(file);

    const result = await processFiles(
      [file],
      {
        [fileKey]: {
          Quantidade: "field_quantity",
        },
      },
      {
        [fileKey]: {
          field_quantity: "fallback",
        },
      },
      "events"
    );

    expect(result.data).toEqual([
      {
        field_quantity: "0",
        idform: "zero.csv",
      },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe("discoverUniqueStatuses", () => {
  it("uses the same unique headers when scanning statuses", async () => {
    const file = createCsvFile(
      "Status,Status\npendente,aprovado\ncancelado,reembolsado",
      "status.csv"
    );
    const fileKey = getFileKey(file);

    const result = await discoverUniqueStatuses(
      [file],
      {
        [fileKey]: {
          Status_2: "field_transaction_status",
        },
      },
      "transactions"
    );

    expect(result.statuses).toEqual(["aprovado", "reembolsado"]);
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("stops scanning and returns a warning after the configured row limit", async () => {
    const rows = Array.from({ length: 5001 }, (_, index) => `pendente_${index % 2}`);
    const file = createCsvFile(
      `Status\n${rows.join("\n")}`,
      "status-limit.csv"
    );
    const fileKey = getFileKey(file);

    const result = await discoverUniqueStatuses(
      [file],
      {
        [fileKey]: {
          Status: "field_transaction_status",
        },
      },
      "transactions"
    );

    expect(result.statuses).toEqual(["pendente_0", "pendente_1"]);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        fileName: "status-limit.csv",
        code: "STATUS_SCAN_LIMIT",
        message: "A coleta de status foi interrompida após 5000 linhas analisadas.",
      }),
    ]);
    expect(result.errors).toEqual([]);
  });

  it("returns structured errors when status discovery cannot read a file", async () => {
    const file = createCsvFile("Status\npendente", "status-erro.csv");
    const fileKey = getFileKey(file);
    const parseSpy = vi.spyOn(Papa, "parse").mockImplementation((_, config) => {
      config?.error?.(new Error("csv parse failed"), "" as never, null);
      return {} as Papa.Parser;
    });

    const result = await discoverUniqueStatuses(
      [file],
      {
        [fileKey]: {
          Status: "field_transaction_status",
        },
      },
      "transactions"
    );

    expect(result.statuses).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([
      expect.objectContaining({
        fileName: "status-erro.csv",
        code: "CSV_PARSE_ERROR",
      }),
    ]);

    parseSpy.mockRestore();
  });
});

describe("parser hardening", () => {
  it("does not hang when PapaParse reports an error during header extraction", async () => {
    const parseSpy = vi.spyOn(Papa, "parse").mockImplementation((_, config) => {
      config?.error?.(new Error("csv parse failed"), "" as never, null);
      return {} as Papa.Parser;
    });

    const file = createCsvFile("qualquer", "erro.csv");
    const fileKey = getFileKey(file);
    const failedMetadata = await extractFileHeaders([file]);

    expect(failedMetadata.metadata[fileKey]).toEqual({ headers: [], samples: {} });
    expect(failedMetadata.errors).toEqual([
      expect.objectContaining({
        fileName: "erro.csv",
        code: "HEADER_EXTRACTION_ERROR",
      }),
    ]);
    parseSpy.mockRestore();
  });
});
