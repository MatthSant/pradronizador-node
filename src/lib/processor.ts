import * as XLSX from "xlsx";
import { parse } from "csv-parse/browser/esm/sync";
import { cleanEmail, mapStatus, cleanSurrogates } from "./normalization";

export interface ProcessingResult {
  data: any[];
  logs: { arquivo: string; origem: string; destino: string }[];
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
    const buffer = await file.arrayBuffer();
    let rawData: any[] = [];

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        rawData = parse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        });
      } else {
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
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
      const buffer = await file.arrayBuffer();
      
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        // Only parse the headers (first row)
        const rawData = parse(text, {
          to: 1, // Only read first line
          columns: false,
          skip_empty_lines: true,
          trim: true,
        });
        if (rawData && rawData.length > 0) {
          rawData[0].forEach((h: string) => allHeaders.add(h));
        }
      } else {
        // Read only the first row for performance
        const workbook = XLSX.read(buffer, { type: "array", sheetRows: 1 });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        
        // sheet_to_json with header: 1 returns an array of arrays
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        if (rows && rows.length > 0) {
          rows[0].forEach((h: any) => {
            if (h !== undefined && h !== null) allHeaders.add(String(h));
          });
        }
      }
    } catch (e) {
      console.error(`Error extracting headers from ${file.name}:`, e);
    }
  }

  return Array.from(allHeaders);
}
