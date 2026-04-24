import * as XLSX from "xlsx";
import Papa from "papaparse";

import { getFileKey } from "./files";
import { makeUniqueHeaders } from "./headers";
import { cleanEmail, mapStatus, cleanSurrogates, normalizeDate } from "./normalization";

export interface MappingLog {
  arquivo: string;
  origem: string;
  destino: string;
  status: "MAPEADO" | "DESCARTADO" | "INJETADO";
}

export interface ProcessingResult {
  data: Record<string, unknown>[];
  logs: MappingLog[];
}

export interface FileHeaderMetadata {
  headers: string[];
  samples: Record<string, string[]>;
}

export interface StatusDiscoveryWarning {
  fileName: string;
  code: "STATUS_SCAN_LIMIT";
  message: string;
}

export interface StatusDiscoveryResult {
  statuses: string[];
  warnings: StatusDiscoveryWarning[];
}

type FileMappings = Record<string, Record<string, string>>;
type FixedValues = Record<string, Record<string, string>>;
type ParsedRow = Record<string, unknown>;

interface ParsedFileData {
  headers: string[];
  rows: ParsedRow[];
}

const MAX_STATUS_ROWS = 5000;
const MAX_UNIQUE_STATUSES = 500;

function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv");
}

function isMeaningfulValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function isDateTarget(target: string): boolean {
  return target === "data" || target.includes("_date") || target === "created_at";
}

function isStatusTarget(target: string): boolean {
  return target === "field_transaction_status" || target === "field_status";
}

function isEmptyMatrixRow(row: unknown[]): boolean {
  return row.every((cell) => !isMeaningfulValue(cell));
}

function normalizeMatrixRows(rows: unknown[]): unknown[][] {
  return rows.filter((row): row is unknown[] => Array.isArray(row));
}

function buildRowsFromMatrix(matrix: unknown[][]): ParsedFileData {
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = matrix;
  const headers = makeUniqueHeaders(headerRow);
  const rows = dataRows
    .filter((row) => !isEmptyMatrixRow(row))
    .map((row) => {
      const record: ParsedRow = {};

      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });

      return record;
    });

  return { headers, rows };
}

function getFirstWorksheet(workbook: XLSX.WorkBook, fileName: string): XLSX.WorkSheet {
  if (!workbook.SheetNames.length) {
    throw new Error(`Arquivo ${fileName} não possui abas legíveis.`);
  }

  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    throw new Error(`A primeira aba do arquivo ${fileName} não pôde ser lida.`);
  }

  return firstSheet;
}

async function parseCsvMatrix(file: File, previewRows?: number): Promise<unknown[][]> {
  const csvText = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      preview: previewRows ? previewRows + 1 : undefined,
      complete: (results) => {
        resolve(normalizeMatrixRows(results.data));
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

async function parseXlsxMatrix(file: File, previewRows?: number): Promise<unknown[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    ...(previewRows ? { sheetRows: previewRows + 1 } : {}),
  });
  const firstSheet = getFirstWorksheet(workbook, file.name);

  return normalizeMatrixRows(
    XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
      header: 1,
      defval: "",
    })
  );
}

async function parseTabularFile(file: File, previewRows?: number): Promise<ParsedFileData> {
  const matrix = isCsvFile(file)
    ? await parseCsvMatrix(file, previewRows)
    : await parseXlsxMatrix(file, previewRows);

  return buildRowsFromMatrix(matrix);
}

function normalizeMappedValue(
  target: string,
  value: unknown,
  statusMappings?: Record<string, string>
): unknown {
  let normalizedValue = cleanSurrogates(value);

  if (target === "field_email") {
    normalizedValue = cleanEmail(String(normalizedValue));
  }

  if (isStatusTarget(target)) {
    const rawStatus = String(normalizedValue).trim();
    normalizedValue =
      statusMappings && statusMappings[rawStatus]
        ? statusMappings[rawStatus]
        : mapStatus(rawStatus);
  }

  if (isDateTarget(target)) {
    normalizedValue = normalizeDate(normalizedValue);
  }

  return normalizedValue;
}

export async function processFiles(
  files: File[],
  mappings: FileMappings,
  fixedValues: FixedValues,
  type: string,
  onProgress?: (filename: string, index: number, total: number) => void | Promise<void>,
  statusMappings?: Record<string, string>
): Promise<ProcessingResult> {
  const combinedData: Record<string, unknown>[] = [];
  const logs: MappingLog[] = [];

  if (!type) {
    return { data: combinedData, logs };
  }

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const fileKey = getFileKey(file);

    if (onProgress) {
      await onProgress(file.name, index + 1, files.length);
    }

    let parsedFile: ParsedFileData = { headers: [], rows: [] };
    const fileMappings = mappings[fileKey] || {};
    const fileFixedValues = fixedValues[fileKey] || {};

    try {
      parsedFile = await parseTabularFile(file);
    } catch (error) {
      console.error(`Error reading ${file.name}:`, error);
      continue;
    }

    if (parsedFile.headers.length > 0) {
      parsedFile.headers.forEach((header) => {
        const target = fileMappings[header];

        if (target && target !== "__NONE__" && target !== "__SKIP__") {
          logs.push({ arquivo: file.name, origem: header, destino: target, status: "MAPEADO" });
          return;
        }

        logs.push({
          arquivo: file.name,
          origem: header,
          destino: "(Ignorado)",
          status: "DESCARTADO",
        });
      });

      Object.keys(fileFixedValues).forEach((target) => {
        logs.push({ arquivo: file.name, origem: "(Fixo)", destino: target, status: "INJETADO" });
      });
    }

    const targetToSources: Record<string, string[]> = {};

    Object.entries(fileMappings).forEach(([source, target]) => {
      if (target !== "__NONE__" && target !== "__SKIP__") {
        if (!targetToSources[target]) {
          targetToSources[target] = [];
        }

        targetToSources[target].push(source);
      }
    });

    const allTargets = Array.from(
      new Set([
        ...Object.values(fileMappings).filter(
          (value) => value !== "__NONE__" && value !== "__SKIP__"
        ),
        ...Object.keys(fileFixedValues),
      ])
    );

    const processedRows = parsedFile.rows.map((row) => {
      const newRow: ParsedRow = {};

      allTargets.forEach((target) => {
        const sources = targetToSources[target] || [];
        let value: unknown = null;

        for (const source of sources) {
          if (isMeaningfulValue(row[source])) {
            value = row[source];
            break;
          }
        }

        if (value !== null) {
          value = normalizeMappedValue(target, value, statusMappings);
        }

        newRow[target] = value;
      });

      Object.entries(fileFixedValues).forEach(([target, value]) => {
        if (!newRow[target] || String(newRow[target]).trim() === "") {
          newRow[target] = value;
        }
      });

      newRow.idform = file.name;

      return newRow;
    });

    combinedData.push(...processedRows);
  }

  return { data: combinedData, logs };
}

export async function discoverUniqueStatuses(
  files: File[],
  mappings: FileMappings,
  type: string
): Promise<StatusDiscoveryResult> {
  const uniqueStatuses = new Set<string>();
  const warnings: StatusDiscoveryWarning[] = [];
  let scannedRows = 0;
  let scanLimitReached = false;

  if (type !== "transactions") {
    return { statuses: [], warnings: [] };
  }

  for (const file of files) {
    if (scanLimitReached) {
      break;
    }

    const fileKey = getFileKey(file);
    const fileMappings = mappings[fileKey] || {};
    const statusCols = Object.entries(fileMappings)
      .filter(([, target]) => isStatusTarget(target))
      .map(([source]) => source);

    if (statusCols.length === 0) {
      continue;
    }

    try {
      const parsedFile = await parseTabularFile(file);

      for (const row of parsedFile.rows) {
        scannedRows += 1;

        if (scannedRows > MAX_STATUS_ROWS) {
          scanLimitReached = true;
          warnings.push({
            fileName: file.name,
            code: "STATUS_SCAN_LIMIT",
            message: `A coleta de status foi interrompida após ${MAX_STATUS_ROWS} linhas analisadas.`,
          });
          break;
        }

        for (const column of statusCols) {
          const value = row[column];

          if (isMeaningfulValue(value)) {
            uniqueStatuses.add(String(value).trim());

            if (uniqueStatuses.size >= MAX_UNIQUE_STATUSES) {
              scanLimitReached = true;
              warnings.push({
                fileName: file.name,
                code: "STATUS_SCAN_LIMIT",
                message: `A coleta de status foi interrompida após ${MAX_UNIQUE_STATUSES} valores únicos.`,
              });
              break;
            }
          }
        }

        if (scanLimitReached) {
          break;
        }
      }
    } catch (error) {
      console.error(`Error scanning statuses in ${file.name}:`, error);
    }
  }

  return {
    statuses: Array.from(uniqueStatuses).sort(),
    warnings,
  };
}

export async function extractFileHeaders(files: File[]): Promise<Record<string, FileHeaderMetadata>> {
  const result: Record<string, FileHeaderMetadata> = {};

  for (const file of files) {
    const fileKey = getFileKey(file);

    try {
      const parsedFile = await parseTabularFile(file, 50);
      const columnSamples: Record<string, Set<string>> = {};

      parsedFile.headers.forEach((header) => {
        columnSamples[header] = new Set();

        parsedFile.rows.forEach((row) => {
          const value = row[header];

          if (isMeaningfulValue(value) && columnSamples[header].size < 5) {
            columnSamples[header].add(String(value).trim());
          }
        });
      });

      result[fileKey] = {
        headers: parsedFile.headers,
        samples: Object.fromEntries(
          Object.entries(columnSamples).map(([header, samples]) => [header, Array.from(samples)])
        ),
      };
    } catch (error) {
      console.error(`Error extracting headers from ${file.name}:`, error);
      result[fileKey] = { headers: [], samples: {} };
    }
  }

  return result;
}
