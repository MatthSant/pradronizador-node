import { describe, it, expect } from 'vitest'
import {
  detectDateFormat,
  isValidDate,
  isFutureDate,
  isValidEmail,
  runQualityCheck,
  applyFixes,
} from './qualityChecker'

// ─── detectDateFormat ─────────────────────────────────────────────────────────

describe('detectDateFormat', () => {
  it.each([
    ['2024-01-15',                    'YYYY-MM-DD'],
    ['2024-01-15 10:30:00',           'YYYY-MM-DD HH:mm:ss'],
    ['2024-01-15T10:30:00',           'YYYY-MM-DDTHH:mm:ss'],
    ['2024-01-15T10:30:00Z',          'YYYY-MM-DDTHH:mm:ssZ'],
    ['2024-01-15T10:30:00+03:00',     'YYYY-MM-DDTHH:mm:ssZ'],
    ['15/01/2024',                    'DD/MM/YYYY'],
    ['5/1/2024',                      'DD/MM/YYYY'],
    ['15/01/2024 10:30:00',           'DD/MM/YYYY HH:mm:ss'],
    ['2024/01/15',                    'YYYY/MM/DD'],
    ['1/15/2024 10:30 AM',            'AM_PM'],
    ['1706745600000',                 'TIMESTAMP_MS'],
    ['1706745600',                    'TIMESTAMP_S'],
    ['not-a-date',                    'UNKNOWN'],
    ['',                              'UNKNOWN'],
  ] as const)('"%s" → %s', (value, expected) => {
    expect(detectDateFormat(value)).toBe(expected)
  })
})

// ─── isValidDate ──────────────────────────────────────────────────────────────

describe('isValidDate', () => {
  it('accepts valid ISO date', () => expect(isValidDate('2024-01-15')).toBe(true))
  it('accepts DD/MM/YYYY', () => expect(isValidDate('15/01/2024')).toBe(true))
  it('accepts timestamp (s)', () => expect(isValidDate('1706745600')).toBe(true))
  it('rejects empty', () => expect(isValidDate('')).toBe(false))
  it('rejects garbage', () => expect(isValidDate('abc')).toBe(false))
  it('rejects impossible date 32/01/2024', () => expect(isValidDate('32/01/2024')).toBe(false))
})

// ─── isFutureDate ─────────────────────────────────────────────────────────────

describe('isFutureDate', () => {
  it('flags year 2099', () => expect(isFutureDate('2099-01-01')).toBe(true))
  it('does not flag past date', () => expect(isFutureDate('2020-01-01')).toBe(false))
  it('returns false for empty', () => expect(isFutureDate('')).toBe(false))
})

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it.each([
    ['test@example.com', true],
    ['user+tag@sub.domain.org', true],
    ['', false],
    ['missing-at.com', false],
    ['@no-local.com', false],
    ['double@@domain.com', false],
    ['spaces in@email.com', false],
  ] as const)('"%s" → %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected)
  })
})

// ─── runQualityCheck ──────────────────────────────────────────────────────────

const BASE = { headers: ['email', 'date', 'name'], dateColumn: 'date', emailColumn: 'email' }

describe('runQualityCheck — empty date', () => {
  it('detects empty date rows', () => {
    const rows = [
      { email: 'a@b.com', date: '',           name: 'A' },
      { email: 'b@b.com', date: '2024-01-01', name: 'B' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const issue = issues.find(i => i.type === 'EMPTY_DATE')
    expect(issue).toBeDefined()
    expect(issue!.count).toBe(1)
    expect(issue!.percentage).toBe(50)
    expect(issue!.affectedRowIndices).toEqual([0])
  })
})

describe('runQualityCheck — invalid date', () => {
  it('detects unparseable date values', () => {
    const rows = [{ email: 'a@b.com', date: 'not-a-date', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'INVALID_DATE')).toBe(true)
  })
})

describe('runQualityCheck — mixed formats', () => {
  it('detects mixed date formats', () => {
    const rows = [
      { email: 'a@b.com', date: '2024-01-01',   name: 'A' },
      { email: 'b@b.com', date: '01/01/2024',   name: 'B' },
      { email: 'c@b.com', date: '2024-01-03',   name: 'C' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'MIXED_DATE_FORMATS')).toBe(true)
  })

  it('does not fire when all formats are the same', () => {
    const rows = [
      { email: 'a@b.com', date: '2024-01-01', name: 'A' },
      { email: 'b@b.com', date: '2024-01-02', name: 'B' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'MIXED_DATE_FORMATS')).toBe(false)
  })
})

describe('runQualityCheck — future date', () => {
  it('flags rows with dates in 2099', () => {
    const rows = [
      { email: 'a@b.com', date: '2099-01-01', name: 'A' },
      { email: 'b@b.com', date: '2020-01-01', name: 'B' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const issue = issues.find(i => i.type === 'FUTURE_DATE')
    expect(issue).toBeDefined()
    expect(issue!.count).toBe(1)
  })
})

describe('runQualityCheck — email issues', () => {
  it('detects empty emails', () => {
    const rows = [{ email: '', date: '2024-01-01', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'EMPTY_EMAIL')).toBe(true)
  })

  it('detects invalid email format', () => {
    const rows = [{ email: 'not-an-email', date: '2024-01-01', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'INVALID_EMAIL')).toBe(true)
  })

})

describe('runQualityCheck — structural issues', () => {
  it('detects empty columns', () => {
    const rows = [
      { email: 'a@b.com', date: '2024-01-01', name: '' },
      { email: 'b@b.com', date: '2024-01-02', name: '' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'EMPTY_COLUMN')).toBe(true)
  })

  it('detects values over 254 chars', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: 'X'.repeat(255) }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'VALUE_TOO_LONG')).toBe(true)
  })

  it('detects linebreaks', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: 'line1\nline2' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'LINEBREAK_IN_VALUE')).toBe(true)
  })

  it('detects whitespace-only cells', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: '   ' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'WHITESPACE_ONLY_VALUE')).toBe(true)
  })

  it('detects control characters', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: 'hello\x07world' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues.some(i => i.type === 'CONTROL_CHARACTERS')).toBe(true)
  })

  it('returns no issues for a clean dataset', () => {
    const rows = [
      { email: 'a@b.com', date: '2024-01-01', name: 'Alice' },
      { email: 'b@b.com', date: '2024-01-02', name: 'Bob' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    expect(issues).toHaveLength(0)
  })
})

// ─── applyFixes ───────────────────────────────────────────────────────────────

describe('applyFixes — DELETE_ROWS', () => {
  it('moves empty-email rows to deletedRows', () => {
    const rows = [
      { email: '',        date: '2024-01-01', name: 'A' },
      { email: 'b@b.com', date: '2024-01-02', name: 'B' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'EMPTY_EMAIL', apply: true, fixType: 'DELETE_ROWS' }], 'date')
    expect(result.cleanRows).toHaveLength(1)
    expect(result.deletedRows).toHaveLength(1)
    expect(result.deletedRows[0]._deleted_reason).toBe('EMPTY_EMAIL')
    expect(result.changelog.length).toBeGreaterThan(0)
  })

  it('a row deleted by two rules is counted once in deletedRows', () => {
    const rows = [{ email: '', date: '', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [
      { issueType: 'EMPTY_EMAIL', apply: true, fixType: 'DELETE_ROWS' },
      { issueType: 'EMPTY_DATE',  apply: true, fixType: 'DELETE_ROWS' },
    ], 'date')
    expect(result.deletedRows).toHaveLength(1)
  })

  it('does not delete when apply=false', () => {
    const rows = [{ email: '', date: '2024-01-01', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'EMPTY_EMAIL', apply: false, fixType: 'DELETE_ROWS' }], 'date')
    expect(result.cleanRows).toHaveLength(1)
    expect(result.deletedRows).toHaveLength(0)
  })
})

describe('applyFixes — NORMALIZE_DATE', () => {
  it('normalizes DD/MM/YYYY to YYYY-MM-DD HH:mm:ss', () => {
    const rows = [{ email: 'a@b.com', date: '15/01/2024', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'MIXED_DATE_FORMATS', apply: true, fixType: 'NORMALIZE_DATE', targetDateFormat: 'YYYY-MM-DD HH:mm:ss' }], 'date')
    expect(result.cleanRows[0].date).toBe('2024-01-15 00:00:00')
  })

  it('normalizes to YYYY-MM-DD when target is short format', () => {
    const rows = [{ email: 'a@b.com', date: '15/01/2024', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'MIXED_DATE_FORMATS', apply: true, fixType: 'NORMALIZE_DATE', targetDateFormat: 'YYYY-MM-DD' }], 'date')
    expect(result.cleanRows[0].date).toBe('2024-01-15')
  })

  it('does not touch already-correct dates', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-15 10:30:00', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'MIXED_DATE_FORMATS', apply: true, fixType: 'NORMALIZE_DATE', targetDateFormat: 'YYYY-MM-DD HH:mm:ss' }], 'date')
    expect(result.cleanRows[0].date).toBe('2024-01-15 10:30:00')
  })
})

describe('applyFixes — in-place fixes', () => {
  it('removes linebreaks', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: 'line1\nline2' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'LINEBREAK_IN_VALUE', apply: true, fixType: 'REMOVE_LINEBREAKS' }], 'date')
    expect(result.cleanRows[0].name).toBe('line1 line2')
  })

  it('truncates values over 254 chars', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: 'X'.repeat(300) }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'VALUE_TOO_LONG', apply: true, fixType: 'TRUNCATE_VALUE' }], 'date')
    expect(result.cleanRows[0].name).toHaveLength(254)
  })

  it('trims whitespace-only cells and control chars', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: '  \x07  ' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'CONTROL_CHARACTERS', apply: true, fixType: 'TRIM_WHITESPACE' }], 'date')
    expect(result.cleanRows[0].name).toBe('')
  })

  it('counts modified rows', () => {
    const rows = [
      { email: 'a@b.com', date: '2024-01-01', name: 'ok' },
      { email: 'b@b.com', date: '2024-01-02', name: 'line1\nline2' },
    ]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'LINEBREAK_IN_VALUE', apply: true, fixType: 'REMOVE_LINEBREAKS' }], 'date')
    expect(result.modifiedRows).toBe(1)
  })
})

describe('applyFixes — REMOVE_COLUMN', () => {
  it('strips empty columns from cleanRows', () => {
    const rows = [
      { email: 'a@b.com', date: '2024-01-01', name: '', extra: '' },
      { email: 'b@b.com', date: '2024-01-02', name: '', extra: '' },
    ]
    const headers = ['email', 'date', 'name', 'extra']
    const { issues } = runQualityCheck({ rows, headers, dateColumn: 'date', emailColumn: 'email' })
    const result = applyFixes(rows, headers, issues, [{ issueType: 'EMPTY_COLUMN', apply: true, fixType: 'REMOVE_COLUMN' }], 'date')
    expect('name' in result.cleanRows[0]).toBe(false)
    expect('extra' in result.cleanRows[0]).toBe(false)
    expect(result.changelog.some(e => e.action === 'REMOVE_COLUMN')).toBe(true)
  })

  it('does not strip columns when apply=false', () => {
    const rows = [{ email: 'a@b.com', date: '2024-01-01', name: '' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'EMPTY_COLUMN', apply: false, fixType: 'REMOVE_COLUMN' }], 'date')
    expect('name' in result.cleanRows[0]).toBe(true)
  })
})

describe('applyFixes — changelog', () => {
  it('produces changelog entries for applied fixes', () => {
    const rows = [{ email: '', date: '2024-01-01', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'EMPTY_EMAIL', apply: true, fixType: 'DELETE_ROWS' }], 'date')
    expect(result.changelog).toHaveLength(1)
    expect(result.changelog[0].action).toBe('DELETE_ROWS')
    expect(result.changelog[0].rowCount).toBe(1)
  })

  it('produces no changelog when no fixes applied', () => {
    const rows = [{ email: '', date: '2024-01-01', name: 'A' }]
    const { issues } = runQualityCheck({ ...BASE, rows })
    const result = applyFixes(rows, BASE.headers, issues, [{ issueType: 'EMPTY_EMAIL', apply: false, fixType: 'DELETE_ROWS' }], 'date')
    expect(result.changelog).toHaveLength(0)
  })
})
