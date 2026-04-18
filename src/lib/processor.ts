import * as XLSX from "xlsx";
import Papa from "papaparse";
import { cleanEmail, mapStatus, cleanSurrogates } from "./normalization";

export interface ProcessingResult {
  data: any[];
  logs: { arquivo: string; origem: string; destino: string }[];
}

// Helper to parse CSV using PapaParse (more robust for browser/large files)
function parseCsv(file: File, options: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...options,
      header: options.columns === true,
      skipEmptyLines: options.skip_empty_lines || true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        resolve(results.data);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}

export async function processFiles(
  files: File[],
  mappings: Record<string, string>, // key is source col, value is target attr
  fixedValues: Record<string, string>,
  type: string
): Promise<ProcessingResult> {
  let combinedData: any[] = [];
  let logs: any[] = [];

  // Group mappings by target to handle backfill/coalesce
  const targetToSources: Record<string, string[]> = {};
  Object.entries(mappings).forEach(([source, target]) => {
    if (target !== "__NONE__" && target !== "__SKIP__") {
      if (!targetToSources[target]) targetToSources[target] = [];
      targetToSources[target].push(source);
    }
  });

  const allTargets = Array.from(new Set([
    ...Object.values(mappings).filter(v => v !== "__NONE__" && v !== "__SKIP__"),
    ...Object.keys(fixedValues)
  ]));

  for (const file of files) {
    let rawData: any[] = [];

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        // PapaParse handles the File object directly (streaming from disk)
        rawData = await parseCsv(file, {
          columns: true,
          skip_empty_lines: true,
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        rawData = XLSX.utils.sheet_to_json(firstSheet);
      }
    } catch (e) {
      console.error(`Error reading ${file.name}:`, e);
      continue;
    }

    const processedRows = rawData.map((row) => {
      const newRow: Record<string, any> = {};
      
      // 1. Process Mappings with Coalesce/Backfill
      allTargets.forEach(target => {
        const sources = targetToSources[target] || [];
        let value: any = null;

        // Take the first non-empty source
        for (const source of sources) {
          if (row[source] !== undefined && row[source] !== null && String(row[source]).trim() !== "") {
            value = row[source];
            logs.push({ arquivo: file.name, origem: source, destino: target });
            break; 
          }
        }

        // Apply cleaning logic
        if (value !== null) {
          value = cleanSurrogates(value);
          if (target === "field_email") value = cleanEmail(String(value));
          if (target === "field_transaction_status") value = mapStatus(String(value));
        }

        newRow[target] = value;
      });

      // 2. Apply Fixed Values (Overwrite or Fill)
      Object.entries(fixedValues).forEach(([target, value]) => {
        if (!newRow[target] || String(newRow[target]).trim() === "") {
          newRow[target] = value;
        }
      });

      // 3. Inject ID Form (Standard)
      newRow["idform"] = file.name;

      return newRow;
    });

    combinedData = [...combinedData, ...processedRows];
  }

  return { data: combinedData, logs };
}

export async function extractFileHeaders(files: File[]): Promise<string[]> {
  const allHeaders = new Set<string>();

  for (const file of files) {
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        // Extract headers using PapaParse (reads only the beginning of the file)
        const headers = await new Promise<string[]>((resolve) => {
          Papa.parse(file, {
            preview: 1, // Read only the first row
            header: false,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                resolve(results.data[0] as string[]);
              } else {
                resolve([]);
              }
            }
          });
        });
        headers.forEach(h => allHeaders.add(h.trim()));
      } else {
        const buffer = await file.arrayBuffer();
        // Read only the first row for performance
        const workbook = XLSX.read(buffer, { type: "array", sheetRows: 1 });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        
        // sheet_to_json with header: 1 returns an array of arrays
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        if (rows && rows.length > 0) {
          rows[0].forEach((h: any) => {
            if (h !== undefined && h !== null) allHeaders.add(String(h).trim());
          });
        }
      }
    } catch (e) {
      console.error(`Error extracting headers from ${file.name}:`, e);
    }
  }

  return Array.from(allHeaders);
}
