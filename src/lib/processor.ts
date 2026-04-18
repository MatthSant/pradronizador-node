import * as XLSX from "xlsx";
import { parse } from "csv-parse/browser/esm/sync";
import { normalizeString, cleanEmail, mapStatus } from "./normalization";

export interface ProcessingResult {
  data: any[];
  logs: { arquivo: string; origem: string; destino: string }[];
}

export async function processFiles(
  files: File[],
  mappings: Record<string, string>,
  fixedValues: Record<string, string>,
  type: string
): Promise<ProcessingResult> {
  let combinedData: any[] = [];
  let logs: any[] = [];

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    let data: any[] = [];

    if (file.name.endsWith(".csv")) {
      const text = new TextDecoder().decode(buffer);
      data = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else {
      const workbook = XLSX.read(buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(firstSheet);
    }

    const processedRows = data.map((row) => {
      const newRow: any = {};
      
      // Apply Mappings
      Object.entries(mappings).forEach(([source, target]) => {
        if (target !== "__NONE__" && row[source] !== undefined) {
          let value = row[source];
          
          if (target === "field_email") value = cleanEmail(String(value));
          if (target === "field_transaction_status") value = mapStatus(String(value));
          
          newRow[target] = value;
          logs.push({ arquivo: file.name, origem: source, destino: target });
        }
      });

      // Apply Fixed Values
      Object.entries(fixedValues).forEach(([target, value]) => {
        newRow[target] = value;
      });

      // Inject ID Form
      newRow["idform"] = file.name;

      return newRow;
    });

    combinedData = [...combinedData, ...processedRows];
  }

  return { data: combinedData, logs };
}
