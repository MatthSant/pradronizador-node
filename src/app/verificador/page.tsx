'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, ChevronRight, ChevronLeft, AlertTriangle,
  XCircle, Info, CheckCircle2, Download, RefreshCw, ShieldCheck,
  Loader2, ToggleLeft, ToggleRight, CalendarDays, Mail, X, ChevronDown,
} from 'lucide-react'
import {
  parseRawFile, runQualityCheck, applyFixes,
  QualityIssue, QualityCheckResult, FixChoice,
  FixResult, IssueSeverity, QualityIssueSample,
} from '@/lib/qualityChecker'
import { createCsvBlob } from '@/lib/csv'

// ─── Types ────────────────────────────────────────────────────────────────────

type FileStatus = 'pending' | 'done'
type Step = 'columns' | 'checking' | 'report' | 'fixes' | 'results'

const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss  (PostgreSQL padrão)' },
  { value: 'YYYY-MM-DD',          label: 'YYYY-MM-DD  (data simples)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityIcon(s: IssueSeverity) {
  if (s === 'error')   return <XCircle       className="w-4 h-4 text-red-500 flex-shrink-0" />
  if (s === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
  return                      <Info          className="w-4 h-4 text-blue-400 flex-shrink-0" />
}

function severityBadge(s: IssueSeverity) {
  const base = 'text-[10px] font-black uppercase px-2 py-0.5 rounded-full'
  if (s === 'error')   return <span className={`${base} bg-red-100 text-red-600`}>Erro</span>
  if (s === 'warning') return <span className={`${base} bg-amber-100 text-amber-700`}>Aviso</span>
  return                      <span className={`${base} bg-blue-100 text-blue-600`}>Info</span>
}

function fixLabel(fix: FixChoice['fixType']): string {
  switch (fix) {
    case 'DELETE_ROWS':     return 'Remover linhas'
    case 'NORMALIZE_DATE':  return 'Normalizar formato'
    case 'REMOVE_LINEBREAKS': return 'Remover quebras de linha'
    case 'TRUNCATE_VALUE':  return 'Truncar em 254 chars'
    case 'TRIM_WHITESPACE': return 'Limpar espaços/ctrl'
    case 'REMOVE_COLUMN':   return 'Remover coluna'
    default:                return 'Ignorar'
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function stemName(filename: string) {
  return filename.replace(/\.[^.]+$/, '')
}

function fmtSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerificadorPage() {
  // ── Queue state
  const [queue, setQueue]         = useState<File[]>([])
  const [statuses, setStatuses]   = useState<FileStatus[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase]         = useState<'upload' | 'processing'>('upload')

  // ── Per-file state (reset on each file)
  const [step, setStep]               = useState<Step>('columns')
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows]   = useState<Record<string, string>[]>([])
  const [dateColumn, setDateColumn]   = useState('')
  const [emailColumn, setEmailColumn] = useState('')
  const [checkResult, setCheckResult] = useState<QualityCheckResult | null>(null)
  const [fixChoices, setFixChoices]   = useState<FixChoice[]>([])
  const [fixResult, setFixResult]     = useState<FixResult | null>(null)
  const [parseError, setParseError]   = useState('')

  const currentFile = queue[currentIdx] ?? null

  // ── Upload ──────────────────────────────────────────────────────────────────

  const onDrop = useCallback((accepted: File[]) => {
    setQueue(prev => {
      const existingNames = new Set(prev.map(f => f.name))
      const fresh = accepted.filter(f => !existingNames.has(f.name))
      return [...prev, ...fresh]
    })
    setStatuses(prev => [...prev, ...accepted.map(() => 'pending' as FileStatus)])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    multiple: true,
    maxSize: 250 * 1024 * 1024,
  })

  function removeFromQueue(idx: number) {
    setQueue(prev => prev.filter((_, i) => i !== idx))
    setStatuses(prev => prev.filter((_, i) => i !== idx))
  }

  async function startProcessing() {
    setParseError('')
    setCurrentIdx(0)
    await loadFile(queue[0])
    setPhase('processing')
  }

  // ── File loading ─────────────────────────────────────────────────────────────

  async function loadFile(file: File) {
    setParseError('')
    setParsedHeaders([]); setParsedRows([]); setDateColumn(''); setEmailColumn('')
    setCheckResult(null); setFixChoices([]); setFixResult(null)
    try {
      const { rows, headers } = await parseRawFile(file)
      setParsedRows(rows)
      setParsedHeaders(headers)
      const guess = (kw: string[]) => headers.find(h => kw.some(k => h.toLowerCase().includes(k))) ?? ''
      setDateColumn(guess(['date', 'data', 'created', 'criado', 'timestamp', 'dt_']))
      setEmailColumn(guess(['email', 'e-mail', 'mail']))
      setStep('columns')
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Erro ao ler arquivo')
    }
  }

  // ── Check ────────────────────────────────────────────────────────────────────

  async function handleRunCheck() {
    if (!dateColumn || !emailColumn) return
    setStep('checking')
    await new Promise(r => setTimeout(r, 50))
    const result = runQualityCheck({ rows: parsedRows, headers: parsedHeaders, dateColumn, emailColumn })
    setCheckResult(result)
    const choices: FixChoice[] = result.issues
      .filter(i => i.suggestedFix !== 'SKIP')
      .map(i => ({
        issueType: i.type,
        apply: i.severity === 'error' || i.severity === 'warning',
        fixType: i.suggestedFix,
        targetDateFormat: 'YYYY-MM-DD HH:mm:ss',
      }))
    setFixChoices(choices)
    setStep('report')
  }

  function toggleChoice(issueType: FixChoice['issueType']) {
    setFixChoices(prev => prev.map(c => c.issueType === issueType ? { ...c, apply: !c.apply } : c))
  }

  function setTargetFormat(issueType: FixChoice['issueType'], fmt: string) {
    setFixChoices(prev => prev.map(c => c.issueType === issueType ? { ...c, targetDateFormat: fmt } : c))
  }

  function handleApplyFixes() {
    if (!checkResult) return
    const result = applyFixes(parsedRows, parsedHeaders, checkResult.issues, fixChoices, dateColumn)
    setFixResult(result)
    setStep('results')
  }

  // ── Downloads ────────────────────────────────────────────────────────────────

  function downloadClean() {
    if (!fixResult || !currentFile) return
    downloadBlob(createCsvBlob(fixResult.cleanRows), `${stemName(currentFile.name)}_limpo.csv`)
  }

  function downloadDeleted() {
    if (!fixResult || !currentFile || !fixResult.deletedRows.length) return
    downloadBlob(createCsvBlob(fixResult.deletedRows), `${stemName(currentFile.name)}_linhas_removidas.csv`)
  }

  function downloadChangelog() {
    if (!fixResult || !currentFile) return
    downloadBlob(
      createCsvBlob(fixResult.changelog as unknown as Record<string, unknown>[]),
      `${stemName(currentFile.name)}_alteracoes.csv`,
    )
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function markCurrentDone() {
    setStatuses(prev => prev.map((s, i) => i === currentIdx ? 'done' : s))
  }

  async function goToNext() {
    markCurrentDone()
    const next = currentIdx + 1
    if (next >= queue.length) {
      reset()
      return
    }
    setCurrentIdx(next)
    await loadFile(queue[next])
  }

  function reset() {
    setQueue([]); setStatuses([]); setCurrentIdx(0); setPhase('upload')
    setParsedHeaders([]); setParsedRows([]); setDateColumn(''); setEmailColumn('')
    setCheckResult(null); setFixChoices([]); setFixResult(null); setParseError('')
  }

  // ─── Step indicator ───────────────────────────────────────────────────────────

  const stepLabels: { key: Step; label: string }[] = [
    { key: 'columns',  label: 'Colunas'   },
    { key: 'report',   label: 'Relatório' },
    { key: 'fixes',    label: 'Correções' },
    { key: 'results',  label: 'Resultado' },
  ]
  const visibleSteps = stepLabels.filter(s => s.key !== 'checking')
  const currentVisible = step === 'checking' ? 'report' : step
  const currentStepIdx = visibleSteps.findIndex(s => s.key === currentVisible)

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[85vh] flex flex-col items-center py-12 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mb-10 space-y-2">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Verificador de Qualidade</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium">
          Detecta e corrige problemas estruturais em arquivos brutos antes de processar.
        </p>
      </motion.div>

      {/* ── PHASE: UPLOAD ──────────────────────────────────────────────────────── */}
      {phase === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl glass-card p-10 border border-slate-100/50 space-y-8"
        >
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Selecionar arquivos</h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 hover:border-slate-400'}`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-10 h-10 mb-3 ${isDragActive ? 'text-amber-400' : 'text-slate-400'}`} />
            <p className="text-slate-600 font-semibold">Arraste ou clique para selecionar</p>
            <p className="text-xs text-slate-400 mt-1">CSV, XLSX ou XLS — máx. 250 MB por arquivo — múltiplos arquivos aceitos</p>
          </div>

          {queue.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {queue.length} {queue.length === 1 ? 'arquivo' : 'arquivos'} na fila
              </p>
              <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {queue.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center space-x-3 px-4 py-3 bg-white">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{fmtSize(f.size)}</p>
                    </div>
                    <button onClick={() => removeFromQueue(i)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parseError && <p className="text-red-500 text-sm font-medium">{parseError}</p>}

          <div className="flex justify-end">
            <button
              onClick={startProcessing}
              disabled={queue.length === 0}
              className="premium-button px-8 py-3 rounded-2xl inline-flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Iniciar verificação</span><ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── PHASE: PROCESSING ──────────────────────────────────────────────────── */}
      {phase === 'processing' && (
        <>
          {/* Queue progress bar */}
          {queue.length > 1 && (
            <div className="w-full max-w-3xl mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Arquivo {currentIdx + 1} de {queue.length}
                </p>
                <p className="text-xs text-slate-400 font-medium truncate max-w-xs">{currentFile?.name}</p>
              </div>
              <div className="flex gap-1.5">
                {queue.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    title={f.name}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      statuses[i] === 'done' ? 'bg-emerald-500'
                      : i === currentIdx     ? 'bg-amber-500'
                      :                        'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step indicator */}
          <div className="w-full max-w-3xl mb-8">
            <div className="flex items-center space-x-2">
              {visibleSteps.map((s, idx) => (
                <React.Fragment key={s.key}>
                  <div className={`flex items-center space-x-1.5 ${idx <= currentStepIdx ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-colors ${idx < currentStepIdx ? 'bg-emerald-500 border-emerald-500 text-white' : idx === currentStepIdx ? 'border-slate-900 text-slate-900 bg-white' : 'border-slate-300 text-slate-400'}`}>
                      {idx < currentStepIdx ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${idx === currentStepIdx ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                  {idx < visibleSteps.length - 1 && <div className={`flex-1 h-px transition-colors ${idx < currentStepIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-3xl glass-card p-10 border border-slate-100/50 space-y-8"
            >
              {/* ── COLUMNS ──────────────────────────────────────────────── */}
              {step === 'columns' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Identificar colunas-chave</h2>
                      <p className="text-sm text-slate-500 mt-1">Selecione as colunas de referência para <span className="font-semibold text-slate-700">{currentFile?.name}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-black uppercase text-slate-500">
                        <CalendarDays className="w-3.5 h-3.5" /><span>Coluna de data</span>
                      </label>
                      <select value={dateColumn} onChange={e => setDateColumn(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">— selecionar —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-black uppercase text-slate-500">
                        <Mail className="w-3.5 h-3.5" /><span>Coluna de email</span>
                      </label>
                      <select value={emailColumn} onChange={e => setEmailColumn(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">— selecionar —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 font-medium">
                    <span className="font-black text-slate-700">{parsedRows.length.toLocaleString('pt-BR')}</span> linhas · <span className="font-black text-slate-700">{parsedHeaders.length}</span> colunas
                  </div>

                  {parseError && <p className="text-red-500 text-sm font-medium">{parseError}</p>}

                  <div className="flex justify-between">
                    <button onClick={() => { markCurrentDone(); reset() }} className="flex items-center space-x-2 text-slate-400 hover:text-slate-700 text-sm font-semibold transition-colors">
                      <X className="w-4 h-4" /><span>Cancelar</span>
                    </button>
                    <button onClick={handleRunCheck} disabled={!dateColumn || !emailColumn} className="premium-button px-8 py-3 rounded-2xl inline-flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed">
                      <span>Verificar</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* ── CHECKING ─────────────────────────────────────────────── */}
              {step === 'checking' && (
                <div className="flex flex-col items-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                  <p className="text-slate-600 font-semibold">Verificando qualidade dos dados…</p>
                  <p className="text-xs text-slate-400">{parsedRows.length.toLocaleString('pt-BR')} linhas · {parsedHeaders.length} colunas</p>
                </div>
              )}

              {/* ── REPORT ───────────────────────────────────────────────── */}
              {step === 'report' && checkResult && (
                <>
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Relatório de qualidade</h2>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{checkResult.totalRows.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400">linhas analisadas</p>
                    </div>
                  </div>

                  {checkResult.issues.length === 0
                    ? <div className="flex flex-col items-center py-10 space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        <p className="text-lg font-black text-emerald-700">Nenhum problema encontrado!</p>
                        <p className="text-sm text-slate-500">O arquivo está limpo e pronto para processamento.</p>
                      </div>
                    : <div className="space-y-3">
                        {(['error', 'warning', 'info'] as IssueSeverity[]).map(sev => {
                          const group = checkResult.issues.filter(i => i.severity === sev)
                          if (!group.length) return null
                          return (
                            <div key={sev} className="space-y-2">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{sev === 'error' ? 'Erros' : sev === 'warning' ? 'Avisos' : 'Informações'}</p>
                              {group.map(issue => <IssueCard key={issue.type} issue={issue} />)}
                            </div>
                          )
                        })}
                      </div>
                  }

                  <div className="flex justify-between">
                    <button onClick={() => setStep('columns')} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors">
                      <ChevronLeft className="w-4 h-4" /><span>Voltar</span>
                    </button>
                    {checkResult.issues.length === 0
                      ? <NextButton currentIdx={currentIdx} total={queue.length} onNext={goToNext} />
                      : <button onClick={() => setStep('fixes')} className="premium-button px-8 py-3 rounded-2xl inline-flex items-center space-x-2">
                          <span>Configurar correções</span><ChevronRight className="w-4 h-4" />
                        </button>
                    }
                  </div>
                </>
              )}

              {/* ── FIXES ────────────────────────────────────────────────── */}
              {step === 'fixes' && checkResult && (
                <>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Configurar correções</h2>
                  <p className="text-sm text-slate-500">Escolha quais correções aplicar. Linhas removidas vão para um arquivo separado.</p>

                  <div className="space-y-3">
                    {fixChoices.map(choice => {
                      const issue = checkResult.issues.find(i => i.type === choice.issueType)!
                      return (
                        <div key={choice.issueType} className={`rounded-xl border p-4 space-y-3 transition-colors ${choice.apply ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-3 min-w-0">
                              {severityIcon(issue.severity)}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 leading-snug">{issue.description}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {issue.count > 0
                                    ? <><span className="font-black text-slate-700">{issue.count.toLocaleString('pt-BR')}</span> {issue.count === 1 ? 'linha' : 'linhas'} ({issue.percentage}%) · {fixLabel(choice.fixType)}</>
                                    : <>{issue.affectedColumn ? `Colunas: ${issue.affectedColumn}` : ''}</>
                                  }
                                </p>
                              </div>
                            </div>
                            <button onClick={() => toggleChoice(choice.issueType)} className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors">
                              {choice.apply ? <ToggleRight className="w-7 h-7 text-amber-500" /> : <ToggleLeft className="w-7 h-7" />}
                            </button>
                          </div>

                          {choice.apply && choice.fixType === 'NORMALIZE_DATE' && (
                            <div className="flex items-center space-x-3 pl-7">
                              <span className="text-xs font-semibold text-slate-500">Formato alvo:</span>
                              <select
                                value={choice.targetDateFormat ?? 'YYYY-MM-DD HH:mm:ss'}
                                onChange={e => setTargetFormat(choice.issueType, e.target.value)}
                                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                {DATE_FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <ImpactSummary issues={checkResult.issues} choices={fixChoices} total={checkResult.totalRows} />

                  <div className="flex justify-between">
                    <button onClick={() => setStep('report')} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors">
                      <ChevronLeft className="w-4 h-4" /><span>Voltar</span>
                    </button>
                    <button onClick={handleApplyFixes} className="premium-button px-8 py-3 rounded-2xl inline-flex items-center space-x-2">
                      <span>Aplicar e gerar arquivos</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* ── RESULTS ──────────────────────────────────────────────── */}
              {step === 'results' && fixResult && (
                <>
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Resultado</h2>
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Linhas limpas',    value: fixResult.cleanRows.length,   color: 'text-emerald-600' },
                      { label: 'Linhas removidas', value: fixResult.deletedRows.length, color: 'text-red-500'     },
                      { label: 'Linhas editadas',  value: fixResult.modifiedRows,       color: 'text-amber-500'   },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-xl px-4 py-4 text-center space-y-1">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {fixResult.changelog.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registro de alterações</p>
                      <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {fixResult.changelog.map((entry, i) => (
                          <div key={i} className="flex items-start space-x-3 px-4 py-3 bg-white">
                            <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">{entry.action}</span>
                            <p className="text-xs text-slate-600 leading-snug">{entry.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Downloads</p>
                    <div className="grid gap-3">
                      <DownloadButton onClick={downloadClean} label={`${stemName(currentFile!.name)}_limpo.csv`} sub={`${fixResult.cleanRows.length.toLocaleString('pt-BR')} linhas`} primary />
                      {fixResult.deletedRows.length > 0 && (
                        <DownloadButton onClick={downloadDeleted} label={`${stemName(currentFile!.name)}_linhas_removidas.csv`} sub={`${fixResult.deletedRows.length.toLocaleString('pt-BR')} linhas · inclui coluna _deleted_reason`} />
                      )}
                      {fixResult.changelog.length > 0 && (
                        <DownloadButton onClick={downloadChangelog} label={`${stemName(currentFile!.name)}_alteracoes.csv`} sub={`${fixResult.changelog.length} operações registradas`} />
                      )}
                    </div>
                  </div>

                  <NextButton currentIdx={currentIdx} total={queue.length} onNext={goToNext} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NextButton({ currentIdx, total, onNext }: { currentIdx: number; total: number; onNext: () => void }) {
  const hasMore = currentIdx + 1 < total
  return (
    <button onClick={onNext} className="w-full flex items-center justify-center space-x-2 text-sm font-semibold transition-colors py-2 text-slate-500 hover:text-slate-900">
      {hasMore
        ? <><ChevronRight className="w-4 h-4" /><span>Próximo arquivo ({currentIdx + 2}/{total})</span></>
        : <><RefreshCw className="w-4 h-4" /><span>Concluído — verificar novos arquivos</span></>
      }
    </button>
  )
}

function IssueCard({ issue }: { issue: QualityIssue }) {
  const [open, setOpen] = useState(false)
  const hasSamples = issue.samples.length > 0

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-start space-x-3 px-4 py-3">
        <div className="mt-0.5">{severityIcon(issue.severity)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {severityBadge(issue.severity)}
            <p className="text-sm font-semibold text-slate-800 leading-tight">{issue.description}</p>
          </div>
          {issue.count > 0 && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              <span className="font-black text-slate-600">{issue.count.toLocaleString('pt-BR')}</span> {issue.count === 1 ? 'linha' : 'linhas'} ({issue.percentage}% do total)
              {' · '}Correção sugerida: <span className="font-bold text-slate-600">{fixLabel(issue.suggestedFix)}</span>
            </p>
          )}
        </div>
        {hasSamples && (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex-shrink-0 flex items-center space-x-1 text-[10px] font-black uppercase tracking-wide text-slate-400 hover:text-slate-700 transition-colors pt-0.5"
          >
            <span>Exemplos</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {hasSamples && open && (
        <SamplesTable samples={issue.samples} total={issue.count} />
      )}
    </div>
  )
}

function SamplesTable({ samples, total }: { samples: QualityIssueSample[]; total: number }) {
  return (
    <div className="border-t border-slate-50 bg-slate-50/60 px-4 py-3 space-y-1.5">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
        Mostrando {samples.length} de {total.toLocaleString('pt-BR')} {total === 1 ? 'ocorrência' : 'ocorrências'}
      </p>
      {samples.map((s, i) => (
        <div key={i} className="flex items-start space-x-3 text-xs">
          <span className="text-slate-400 font-mono w-14 flex-shrink-0 pt-px">linha {s.row}</span>
          <span className="text-slate-500 font-semibold flex-shrink-0 max-w-[90px] truncate">{s.column}</span>
          <span className="text-slate-700 font-mono break-all leading-relaxed">{s.value || <em className="text-slate-400 not-italic">(vazio)</em>}</span>
        </div>
      ))}
    </div>
  )
}

function ImpactSummary({ issues, choices, total }: { issues: QualityIssue[]; choices: FixChoice[]; total: number }) {
  const toDelete = new Set<number>()
  for (const c of choices) {
    if (!c.apply || c.fixType !== 'DELETE_ROWS') continue
    issues.find(i => i.type === c.issueType)?.affectedRowIndices.forEach(i => toDelete.add(i))
  }
  const kept = total - toDelete.size
  const pct = total > 0 ? Math.round((toDelete.size / total) * 1000) / 10 : 0
  return (
    <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-5 py-4 flex items-center space-x-6">
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase text-amber-600">Linhas mantidas</span>
        <span className="text-xl font-black text-slate-900">{kept.toLocaleString('pt-BR')}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase text-red-500">Linhas removidas</span>
        <span className="text-xl font-black text-slate-900">{toDelete.size.toLocaleString('pt-BR')} <span className="text-sm font-medium text-slate-400">({pct}%)</span></span>
      </div>
    </div>
  )
}

function DownloadButton({ onClick, label, sub, primary = false }: { onClick: () => void; label: string; sub: string; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl border text-left transition-all hover:-translate-y-0.5 active:translate-y-0 ${primary ? 'border-emerald-200 bg-emerald-50/50 hover:shadow-md hover:shadow-emerald-900/5' : 'border-slate-100 bg-white hover:shadow-md hover:shadow-slate-900/5'}`}
    >
      <Download className={`w-5 h-5 flex-shrink-0 ${primary ? 'text-emerald-600' : 'text-slate-400'}`} />
      <div className="min-w-0">
        <p className={`text-sm font-bold truncate ${primary ? 'text-emerald-800' : 'text-slate-700'}`}>{label}</p>
        <p className="text-xs text-slate-400 font-medium">{sub}</p>
      </div>
    </button>
  )
}
