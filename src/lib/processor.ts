import * as XLSX from "xlsx";
import Papa from "papaparse";
import { cleanEmail, mapStatus, cleanSurrogates, normalizeDate } from "./normalization";

export interface ProcessingResult {
  data: any[];
  logs: { 
    arquivo: string; 
    origem: string; 
    destino: string; 
    status: 'MAPEADO' | 'DESCARTADO' | 'INJETADO'
  }[];
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
  mappings: Record<string, Record<string, string>>, // Key: filename, Value: { sourceCol: targetAttr }
  fixedValues: Record<string, Record<string, string>>, // Key: filename, Value: { targetAttr: value }
  type: string,
  onProgress?: (filename: string, index: number, total: number) => void,
  statusMappings?: Record<string, string> // New: manual status overrrides
): Promise<ProcessingResult> {
  let combinedData: any[] = [];
  let logs: { arquivo: string; origem: string; destino: string; status: 'MAPEADO' | 'DESCARTADO' | 'INJETADO' }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(file.name, i + 1, files.length);

    let rawData: any[] = [];
    const fileMappings = mappings[file.name] || {};
    const fileFixedValues = fixedValues[file.name] || {};

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        rawData = await parseCsv(file, {
          columns: true,
          skip_empty_lines: true,
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        rawData = XLSX.utils.sheet_to_json(firstSheet);
      }
    } catch (e) {
      console.error(`Error reading ${file.name}:`, e);
      continue;
    }

    if (rawData.length > 0) {
      const firstRow = rawData[0];
      const headers = Object.keys(firstRow);

      // Log Mappings and Discards
      headers.forEach(h => {
        const target = fileMappings[h];
        if (target && target !== "__NONE__" && target !== "__SKIP__") {
          logs.push({ arquivo: file.name, origem: h, destino: target, status: 'MAPEADO' });
        } else {
          logs.push({ arquivo: file.name, origem: h, destino: '(Ignorado)', status: 'DESCARTADO' });
        }
      });

      // Log Injected Values
      Object.entries(fileFixedValues).forEach(([target, _]) => {
        logs.push({ arquivo: file.name, origem: '(Fixo)', destino: target, status: 'INJETADO' });
      });
    }

    // Process the data row by row
    // Group this file's mappings by target to handle backfill/coalesce
    const targetToSources: Record<string, string[]> = {};
    Object.entries(fileMappings).forEach(([source, target]) => {
      if (target !== "__NONE__" && target !== "__SKIP__") {
        if (!targetToSources[target]) targetToSources[target] = [];
        targetToSources[target].push(source);
      }
    });

    const allTargets = Array.from(new Set([
      ...Object.values(fileMappings).filter(v => v !== "__NONE__" && v !== "__SKIP__"),
      ...Object.keys(fileFixedValues)
    ]));

    const processedRows = rawData.map((row) => {
      const newRow: Record<string, any> = {};
      
      // 1. Process Mappings for this file
      allTargets.forEach(target => {
        const sources = targetToSources[target] || [];
        let value: any = null;

        for (const source of sources) {
          if (row[source] !== undefined && row[source] !== null && String(row[source]).trim() !== "") {
            value = row[source];
            break; 
          }
        }

        if (value !== null) {
          value = cleanSurrogates(value);
          if (target === "field_email") value = cleanEmail(String(value));
          
          // STATUS NORMALIZATION LOGIC
          if (target === "field_transaction_status" || target === "field_status") {
            const rawStatus = String(value).trim();
            // Use manual mapping if provided, else fallback to automatic logic
            if (statusMappings && statusMappings[rawStatus]) {
              value = statusMappings[rawStatus];
            } else {
              value = mapStatus(rawStatus);
            }
          }
          
          if (target === "data" || target.includes("_date") || target === "created_at") {
            value = normalizeDate(value);
          }
        }

        newRow[target] = value;
      });

      // 2. Apply Fixed Values
      Object.entries(fileFixedValues).forEach(([target, value]) => {
        if (!newRow[target] || String(newRow[target]).trim() === "") {
          newRow[target] = value;
        }
      });

      newRow["idform"] = file.name;
      return newRow;
    });

    combinedData = [...combinedData, ...processedRows];
  }

  return { data: combinedData, logs };
}

/**
 * Scans all provided files to find unique values in the column(s) mapped to status.
 */
export async function discoverUniqueStatuses(
  files: File[],
  mappings: Record<string, Record<string, string>>,
  type: string
): Promise<string[]> {
  const uniqueStatuses = new Set<string>();
  if (type !== 'transactions') return [];

  for (const file of files) {
    const fileMappings = mappings[file.name] || {};
    const statusCols = Object.entries(fileMappings)
      .filter(([_, target]) => target === 'field_transaction_status' || target === 'field_status')
      .map(([source, _]) => source);

    if (statusCols.length === 0) continue;

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        await new Promise<void>((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: (results) => {
              const row = results.data as any;
              statusCols.forEach(col => {
                const val = row[col];
                if (val !== undefined && val !== null && String(val).trim().length > 0) {
                  uniqueStatuses.add(String(val).trim());
                }
              });
            },
            complete: () => {
              resolve();
            }
          });
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(firstSheet) as any[];
        
        rows.forEach(row => {
          statusCols.forEach(col => {
            const val = row[col];
            if (val !== undefined && val !== null && String(val).trim().length > 0) {
              uniqueStatuses.add(String(val).trim());
            }
          });
        });
      }
    } catch (e) {
      console.error(`Error scanning statuses in ${file.name}:`, e);
    }
  }

  return Array.from(uniqueStatuses).sort();
}

export async function extractFileHeaders(files: File[]): Promise<Record<string, { headers: string[], samples: Record<string, string[]> }>> {
  const result: Record<string, { headers: string[], samples: Record<string, string[]> }> = {};

  for (const file of files) {
    const allHeaders = new Set<string>();
    const columnSamples: Record<string, Set<string>> = {};

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        await new Promise<void>((resolve) => {
          Papa.parse(file, {
            preview: 50, 
            header: false,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                const headers = results.data[0] as string[];
                const rows = results.data.slice(1);
                
                headers.forEach((h, idx) => {
                  if (typeof h === 'string' && h.trim().length > 0) {
                    const cleanH = h.trim();
                    allHeaders.add(cleanH);
                    if (!columnSamples[cleanH]) columnSamples[cleanH] = new Set();
                    
                    rows.forEach(row => {
                      const val = row[idx];
                      if (val !== undefined && val !== null && String(val).trim().length > 0) {
                        if (columnSamples[cleanH].size < 5) columnSamples[cleanH].add(String(val).trim());
                      }
                    });
                  }
                });
              }
              resolve();
            }
          });
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", sheetRows: 50 });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        if (rows && rows.length > 0) {
          const headers = rows[0];
          const dataRows = rows.slice(1);
          
          headers.forEach((h, idx) => {
            const cleanH = String(h || "").trim();
            if (cleanH.length > 0) {
              allHeaders.add(cleanH);
              if (!columnSamples[cleanH]) columnSamples[cleanH] = new Set();
              
              dataRows.forEach(row => {
                const val = row[idx];
                if (val !== undefined && val !== null && String(val).trim().length > 0) {
                  if (columnSamples[cleanH].size < 5) columnSamples[cleanH].add(String(val).trim());
                }
              });
            }
          });
        }
      }

      const finalSamples: Record<string, string[]> = {};
      Object.entries(columnSamples).forEach(([h, set]) => {
        finalSamples[h] = Array.from(set);
      });

      result[file.name] = {
        headers: Array.from(allHeaders),
        samples: finalSamples
      };
    } catch (e) {
      console.error(`Error extracting headers from ${file.name}:`, e);
      result[file.name] = { headers: [], samples: {} };
    }
  }

  return result;
}
