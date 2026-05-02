import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateFormat =
  | 'YYYY-MM-DD'
  | 'YYYY-MM-DD HH:mm:ss'
  | 'YYYY-MM-DDTHH:mm:ss'
  | 'YYYY-MM-DDTHH:mm:ssZ'
  | 'DD/MM/YYYY'
  | 'DD/MM/YYYY HH:mm:ss'
  | 'YYYY/MM/DD'
  | 'AM_PM'
  | 'TIMESTAMP_S'
  | 'TIMESTAMP_MS'
  | 'UNKNOWN'

export type IssueType =
  | 'MIXED_DATE_FORMATS'
  | 'EMPTY_DATE'
  | 'INVALID_DATE'
  | 'FUTURE_DATE'
  | 'EMPTY_EMAIL'
  | 'INVALID_EMAIL'
  | 'EMPTY_COLUMN'
  | 'VALUE_TOO_LONG'
  | 'LINEBREAK_IN_VALUE'
  | 'WHITESPACE_ONLY_VALUE'
  | 'CONTROL_CHARACTERS'

export type FixType =
  | 'DELETE_ROWS'
  | 'NORMALIZE_DATE'
  | 'TRIM_WHITESPACE'
  | 'REMOVE_LINEBREAKS'
  | 'TRUNCATE_VALUE'
  | 'REMOVE_COLUMN'
  | 'SKIP'

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface QualityIssueSample {
  row: number   // 1-indexed for display
  column: string
  value: string // display-safe (linebreaks replaced, truncated if needed)
}

export interface QualityIssue {
  type: IssueType
  severity: IssueSeverity
  description: string
  affectedRowIndices: number[]
  affectedColumn?: string
  count: number
  percentage: number
  suggestedFix: FixType
  samples: QualityIssueSample[]
  extraData?: Record<string, unknown>
}

export interface FixChoice {
  issueType: IssueType
  apply: boolean
  fixType: FixType
  targetDateFormat?: string
}

export interface ChangeLogEntry {
  action: string
  column?: string
  rowCount: number
  description: string
}

export interface FixResult {
  cleanRows: Record<string, string>[]
  deletedRows: (Record<string, string> & { _deleted_reason: string })[]
  modifiedRows: number
  changelog: ChangeLogEntry[]
}

export interface QualityCheckInput {
  rows: Record<string, string>[]
  headers: string[]
  dateColumn: string
  emailColumn: string
}

export interface QualityCheckResult {
  totalRows: number
  issues: QualityIssue[]
  headers: string[]
  detectedDateFormats: Partial<Record<DateFormat, number>>
}

export interface ParsedFile {
  rows: Record<string, string>[]
  headers: string[]
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DATE_PATTERNS: { format: DateFormat; regex: RegExp }[] = [
  { format: 'YYYY-MM-DDTHH:mm:ssZ', regex: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/ },
  { format: 'YYYY-MM-DDTHH:mm:ss',  regex: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/ },
  { format: 'YYYY-MM-DD HH:mm:ss',  regex: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/ },
  { format: 'YYYY-MM-DD',           regex: /^\d{4}-\d{2}-\d{2}$/ },
  { format: 'YYYY/MM/DD',           regex: /^\d{4}\/\d{2}\/\d{2}$/ },
  { format: 'DD/MM/YYYY HH:mm:ss',  regex: /^\d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}:\d{2}$/ },
  { format: 'DD/MM/YYYY',           regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
  { format: 'AM_PM',                regex: /\d{1,2}\/\d{1,2}\/\d{4}.*?(AM|PM)/i },
  { format: 'TIMESTAMP_MS',         regex: /^\d{13}$/ },
  { format: 'TIMESTAMP_S',          regex: /^\d{10}$/ },
]

export function detectDateFormat(value: string): DateFormat {
  const t = value.trim()
  for (const { format, regex } of DATE_PATTERNS) {
    if (regex.test(t)) return format
  }
  return 'UNKNOWN'
}

function parseDate(value: string): Date | null {
  const t = value.trim()
  if (!t) return null
  const fmt = detectDateFormat(t)

  if (fmt === 'DD/MM/YYYY' || fmt === 'DD/MM/YYYY HH:mm:ss') {
    const [datePart, timePart = ''] = t.split(' ')
    const [d, m, y] = datePart.split('/')
    const day = +d, month = +m, year = +y
    const [h = '0', min = '0', s = '0'] = timePart.split(':')
    const dt = new Date(year, month - 1, day, +h, +min, +s)
    // Reject overflow (e.g. 32/01/2024 wraps to Feb)
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null
    return isNaN(dt.getTime()) ? null : dt
  }
  if (fmt === 'TIMESTAMP_S') return new Date(parseInt(t) * 1000)
  if (fmt === 'TIMESTAMP_MS') return new Date(parseInt(t))

  const dt = new Date(t)
  return isNaN(dt.getTime()) ? null : dt
}

export function isValidDate(value: string): boolean {
  return parseDate(value) !== null
}

export function isFutureDate(value: string): boolean {
  const d = parseDate(value)
  return d !== null && d > new Date()
}

function toTargetFormat(value: string, targetFormat: string): string {
  const d = parseDate(value)
  if (!d) return value
  const p = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  const time = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  if (targetFormat === 'YYYY-MM-DD') return date
  return `${date} ${time}`
}

// ─── Email helpers ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

// ─── Sample helpers ───────────────────────────────────────────────────────────

const MAX_SAMPLES = 5

function makeSamples(
  rows: Record<string, string>[],
  indices: number[],
  column: string,
  display: (val: string) => string = v => v || '(vazio)',
): QualityIssueSample[] {
  return indices.slice(0, MAX_SAMPLES).map(i => ({
    row: i + 1,
    column,
    value: display(rows[i]?.[column] ?? ''),
  }))
}

function makeSamplesMultiCol(
  rows: Record<string, string>[],
  indices: number[],
  headers: string[],
  test: (val: string) => boolean,
  display: (val: string, col: string) => string = v => v,
): QualityIssueSample[] {
  return indices.slice(0, MAX_SAMPLES).map(i => {
    const col = headers.find(c => test(rows[i]?.[c] ?? '')) ?? headers[0]
    return { row: i + 1, column: col, value: display(rows[i]?.[col] ?? '', col) }
  })
}

function truncateDisplay(v: string, max = 80): string {
  if (!v) return '(vazio)'
  return v.length > max ? `${v.slice(0, max)}… (${v.length} chars)` : v
}

// ─── Quality check ────────────────────────────────────────────────────────────

export function runQualityCheck(input: QualityCheckInput): QualityCheckResult {
  const { rows, headers, dateColumn, emailColumn } = input
  const total = rows.length
  const issues: QualityIssue[] = []

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0

  // 1. EMPTY_DATE
  const emptyDateIdx = rows.map((r, i) => [r, i] as const).filter(([r]) => !r[dateColumn]?.trim()).map(([, i]) => i)
  if (emptyDateIdx.length)
    issues.push({ type: 'EMPTY_DATE', severity: 'error', description: `Datas vazias na coluna "${dateColumn}"`, affectedRowIndices: emptyDateIdx, affectedColumn: dateColumn, count: emptyDateIdx.length, percentage: pct(emptyDateIdx.length), suggestedFix: 'DELETE_ROWS', samples: makeSamples(rows, emptyDateIdx, dateColumn) })

  // 2. INVALID_DATE
  const invalidDateIdx = rows.map((r, i) => [r, i] as const).filter(([r]) => r[dateColumn]?.trim() && !isValidDate(r[dateColumn])).map(([, i]) => i)
  if (invalidDateIdx.length)
    issues.push({ type: 'INVALID_DATE', severity: 'error', description: `Datas inválidas (não parseáveis) em "${dateColumn}"`, affectedRowIndices: invalidDateIdx, affectedColumn: dateColumn, count: invalidDateIdx.length, percentage: pct(invalidDateIdx.length), suggestedFix: 'DELETE_ROWS', samples: makeSamples(rows, invalidDateIdx, dateColumn, v => v) })

  // 3. MIXED_DATE_FORMATS
  const formatCounts: Partial<Record<DateFormat, number>> = {}
  const validDateRows = rows.map((r, i) => [r, i] as const).filter(([r]) => r[dateColumn]?.trim() && isValidDate(r[dateColumn]))
  for (const [r] of validDateRows) {
    const fmt = detectDateFormat(r[dateColumn])
    formatCounts[fmt] = (formatCounts[fmt] ?? 0) + 1
  }
  const detectedFormats = Object.keys(formatCounts) as DateFormat[]
  if (detectedFormats.length > 1) {
    const dominant = detectedFormats.sort((a, b) => (formatCounts[b] ?? 0) - (formatCounts[a] ?? 0))[0]
    const mixedIdx = validDateRows.filter(([r]) => detectDateFormat(r[dateColumn]) !== dominant).map(([, i]) => i)
    issues.push({ type: 'MIXED_DATE_FORMATS', severity: 'warning', description: `Formatos de data mistos em "${dateColumn}": ${detectedFormats.join(', ')}`, affectedRowIndices: mixedIdx, affectedColumn: dateColumn, count: mixedIdx.length, percentage: pct(mixedIdx.length), suggestedFix: 'NORMALIZE_DATE', samples: makeSamples(rows, mixedIdx, dateColumn, v => `${v}  [${detectDateFormat(v)}]`), extraData: { formats: formatCounts, dominant } })
  }

  // 4. FUTURE_DATE
  const futureDateIdx = validDateRows.filter(([r]) => isFutureDate(r[dateColumn])).map(([, i]) => i)
  if (futureDateIdx.length)
    issues.push({ type: 'FUTURE_DATE', severity: 'warning', description: `Datas no futuro em "${dateColumn}"`, affectedRowIndices: futureDateIdx, affectedColumn: dateColumn, count: futureDateIdx.length, percentage: pct(futureDateIdx.length), suggestedFix: 'DELETE_ROWS', samples: makeSamples(rows, futureDateIdx, dateColumn, v => v) })

  // 5. EMPTY_EMAIL
  const emptyEmailIdx = rows.map((r, i) => [r, i] as const).filter(([r]) => !r[emailColumn]?.trim()).map(([, i]) => i)
  if (emptyEmailIdx.length)
    issues.push({ type: 'EMPTY_EMAIL', severity: 'error', description: `Emails vazios na coluna "${emailColumn}"`, affectedRowIndices: emptyEmailIdx, affectedColumn: emailColumn, count: emptyEmailIdx.length, percentage: pct(emptyEmailIdx.length), suggestedFix: 'DELETE_ROWS', samples: makeSamples(rows, emptyEmailIdx, emailColumn) })

  // 6. INVALID_EMAIL
  const invalidEmailIdx = rows.map((r, i) => [r, i] as const).filter(([r]) => r[emailColumn]?.trim() && !isValidEmail(r[emailColumn])).map(([, i]) => i)
  if (invalidEmailIdx.length)
    issues.push({ type: 'INVALID_EMAIL', severity: 'error', description: `Emails com formato inválido em "${emailColumn}"`, affectedRowIndices: invalidEmailIdx, affectedColumn: emailColumn, count: invalidEmailIdx.length, percentage: pct(invalidEmailIdx.length), suggestedFix: 'DELETE_ROWS', samples: makeSamples(rows, invalidEmailIdx, emailColumn, v => v) })

  // 7. EMPTY_COLUMN
  const emptyCols = headers.filter(col => !rows.some(r => r[col]?.trim()))
  if (emptyCols.length)
    issues.push({ type: 'EMPTY_COLUMN', severity: 'warning', description: `Colunas sem nenhum dado: ${emptyCols.join(', ')}`, affectedRowIndices: [], affectedColumn: emptyCols.join(', '), count: emptyCols.length, percentage: 0, suggestedFix: 'REMOVE_COLUMN', samples: [], extraData: { columns: emptyCols } })

  // 8. VALUE_TOO_LONG
  const tooLongIdx: number[] = []
  rows.forEach((r, i) => { if (headers.some(c => (r[c] ?? '').length > 254) && !tooLongIdx.includes(i)) tooLongIdx.push(i) })
  if (tooLongIdx.length)
    issues.push({ type: 'VALUE_TOO_LONG', severity: 'warning', description: 'Linhas com valores acima de 254 caracteres', affectedRowIndices: tooLongIdx, count: tooLongIdx.length, percentage: pct(tooLongIdx.length), suggestedFix: 'TRUNCATE_VALUE', samples: makeSamplesMultiCol(rows, tooLongIdx, headers, v => v.length > 254, (v, col) => `[${col}] ${truncateDisplay(v)}`) })

  // 9. LINEBREAK_IN_VALUE
  const linebreakIdx: number[] = []
  rows.forEach((r, i) => { if (headers.some(c => /[\r\n]/.test(r[c] ?? '')) && !linebreakIdx.includes(i)) linebreakIdx.push(i) })
  if (linebreakIdx.length)
    issues.push({ type: 'LINEBREAK_IN_VALUE', severity: 'warning', description: 'Linhas com quebras de linha em células', affectedRowIndices: linebreakIdx, count: linebreakIdx.length, percentage: pct(linebreakIdx.length), suggestedFix: 'REMOVE_LINEBREAKS', samples: makeSamplesMultiCol(rows, linebreakIdx, headers, v => /[\r\n]/.test(v), (v, col) => `[${col}] ${v.replace(/[\r\n]+/g, ' ↵ ').slice(0, 80)}`) })

  // 10. WHITESPACE_ONLY_VALUE
  const wsIdx: number[] = []
  rows.forEach((r, i) => { if (headers.some(c => { const v = r[c] ?? ''; return v.length > 0 && !v.trim() }) && !wsIdx.includes(i)) wsIdx.push(i) })
  if (wsIdx.length)
    issues.push({ type: 'WHITESPACE_ONLY_VALUE', severity: 'info', description: 'Células com apenas espaços em branco', affectedRowIndices: wsIdx, count: wsIdx.length, percentage: pct(wsIdx.length), suggestedFix: 'TRIM_WHITESPACE', samples: makeSamplesMultiCol(rows, wsIdx, headers, v => v.length > 0 && !v.trim(), (v, col) => `[${col}] (${v.length} espaços)`) })

  // 11. CONTROL_CHARACTERS
  const ctrlIdx: number[] = []
  rows.forEach((r, i) => { if (headers.some(c => /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(r[c] ?? '')) && !ctrlIdx.includes(i)) ctrlIdx.push(i) })
  if (ctrlIdx.length)
    issues.push({ type: 'CONTROL_CHARACTERS', severity: 'warning', description: 'Caracteres de controle invisíveis (podem corromper importação)', affectedRowIndices: ctrlIdx, count: ctrlIdx.length, percentage: pct(ctrlIdx.length), suggestedFix: 'TRIM_WHITESPACE', samples: makeSamplesMultiCol(rows, ctrlIdx, headers, v => /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(v), (v, col) => `[${col}] ${v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '·').slice(0, 80)}`) })

  return { totalRows: total, issues, headers, detectedDateFormats: formatCounts }
}

// ─── Apply fixes ──────────────────────────────────────────────────────────────

export function applyFixes(
  rows: Record<string, string>[],
  headers: string[],
  issues: QualityIssue[],
  choices: FixChoice[],
  dateColumn: string,
): FixResult {
  const changelog: ChangeLogEntry[] = []
  const deletedMap = new Map<number, string>()

  // Pass 1: collect all rows to delete
  for (const choice of choices) {
    if (!choice.apply || choice.fixType !== 'DELETE_ROWS') continue
    const issue = issues.find(i => i.type === choice.issueType)
    if (!issue) continue
    for (const idx of issue.affectedRowIndices) {
      if (!deletedMap.has(idx)) deletedMap.set(idx, issue.type)
    }
    changelog.push({ action: 'DELETE_ROWS', column: issue.affectedColumn, rowCount: issue.affectedRowIndices.length, description: `Removidas ${issue.affectedRowIndices.length} linhas — ${issue.description}` })
  }

  // Pass 2: collect columns to remove
  const colsToRemove = new Set<string>()
  for (const choice of choices) {
    if (!choice.apply || choice.fixType !== 'REMOVE_COLUMN') continue
    const issue = issues.find(i => i.type === choice.issueType)
    const cols = issue?.extraData?.columns as string[] | undefined
    cols?.forEach(c => colsToRemove.add(c))
  }
  if (colsToRemove.size > 0)
    changelog.push({ action: 'REMOVE_COLUMN', rowCount: 0, description: `Removidas ${colsToRemove.size} coluna(s) vazia(s): ${[...colsToRemove].join(', ')}` })

  // Pass 3: check if NORMALIZE_DATE is chosen
  const normalizeDateChoice = choices.find(c => c.apply && c.fixType === 'NORMALIZE_DATE')
  const targetFmt = normalizeDateChoice?.targetDateFormat ?? 'YYYY-MM-DD HH:mm:ss'

  if (normalizeDateChoice) {
    const normalizable = rows.filter((r, i) => !deletedMap.has(i) && r[dateColumn]?.trim() && isValidDate(r[dateColumn])).length
    changelog.push({ action: 'NORMALIZE_DATE', column: dateColumn, rowCount: normalizable, description: `Normalizadas datas para formato ${targetFmt}` })
  }

  // Pass 3: collect other in-place fix choices
  const inPlaceChoices = choices.filter(c => c.apply && c.fixType !== 'DELETE_ROWS' && c.fixType !== 'NORMALIZE_DATE')
  for (const choice of inPlaceChoices) {
    const issue = issues.find(i => i.type === choice.issueType)
    if (!issue) continue
    const affected = issue.affectedRowIndices.filter(i => !deletedMap.has(i))
    if (affected.length)
      changelog.push({ action: choice.fixType, column: issue.affectedColumn, rowCount: affected.length, description: `Aplicado ${choice.fixType} em ${affected.length} linhas — ${issue.description}` })
  }

  // Build output
  const cleanRows: Record<string, string>[] = []
  const deletedRows: (Record<string, string> & { _deleted_reason: string })[] = []
  let modifiedRows = 0

  for (let i = 0; i < rows.length; i++) {
    if (deletedMap.has(i)) {
      deletedRows.push({ ...rows[i], _deleted_reason: deletedMap.get(i)! })
      continue
    }

    const row = { ...rows[i] }
    for (const col of colsToRemove) delete row[col]
    let modified = false

    // Normalize date (applies to ALL valid date rows, not just affectedRowIndices)
    if (normalizeDateChoice) {
      const orig = row[dateColumn]
      if (orig?.trim() && isValidDate(orig)) {
        const normalized = toTargetFormat(orig, targetFmt)
        if (normalized !== orig) { row[dateColumn] = normalized; modified = true }
      }
    }

    // In-place fixes scoped to affectedRowIndices
    for (const choice of inPlaceChoices) {
      const issue = issues.find(iss => iss.type === choice.issueType)
      if (!issue?.affectedRowIndices.includes(i)) continue

      if (choice.fixType === 'REMOVE_LINEBREAKS') {
        for (const col of headers) {
          const orig = row[col] ?? ''
          const next = orig.replace(/[\r\n]+/g, ' ').trim()
          if (next !== orig) { row[col] = next; modified = true }
        }
      }
      if (choice.fixType === 'TRIM_WHITESPACE') {
        for (const col of headers) {
          const orig = row[col] ?? ''
          const next = orig.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
          if (next !== orig) { row[col] = next; modified = true }
        }
      }
      if (choice.fixType === 'TRUNCATE_VALUE') {
        for (const col of headers) {
          if ((row[col] ?? '').length > 254) { row[col] = row[col].slice(0, 254); modified = true }
        }
      }
    }

    if (modified) modifiedRows++
    cleanRows.push(row)
  }

  return { cleanRows, deletedRows, modifiedRows, changelog }
}

// ─── File parsing (browser-only) ──────────────────────────────────────────────

export function parseRawFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => h.trim(),
        })
        if (result.errors.length && result.data.length === 0) { reject(new Error('Falha ao parsear CSV')); return }
        resolve({ rows: result.data as Record<string, string>[], headers: result.meta.fields ?? [] })
      }
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
      reader.readAsText(file, 'UTF-8')
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })
        resolve({ rows: json, headers: Object.keys(json[0] ?? {}) })
      }
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
      reader.readAsArrayBuffer(file)
    } else {
      reject(new Error('Formato não suportado. Use CSV, XLSX ou XLS.'))
    }
  })
}
