import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import { getFriendlyAnswerTypeLabel } from '@/features/questions/utils/answer-type-label'
import type { AnketYanitSoruDto } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { getSurveyFillQuestionLabel } from './is-ekici-producer-question'
import { parseMultiSelectValue } from './multi-select-value'
import { getQuestionDisplayNumber } from './oturum-questions'
import { getQuestionKey } from './question-key'
import {
  resolveEffectiveQuestionInputKind,
  type QuestionInputKind,
} from './resolve-question-input-kind'

function formatExportDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveOptionLabel(
  question: AnketYanitSoruDto,
  optionId: number,
): string {
  const option = (question.altSecenekler ?? []).find((item) => item.id === optionId)
  return option?.adi?.trim() || `#${optionId}`
}

function resolveAnswerDisplayValue(
  question: AnketYanitSoruDto,
  rawValue: string,
  kind: QuestionInputKind,
): string {
  const value = rawValue.trim()
  if (!value) return '—'

  if (kind === 'select') {
    const optionId = Number(value)
    if (Number.isFinite(optionId) && optionId > 0) {
      return resolveOptionLabel(question, optionId)
    }
    return value
  }

  if (kind === 'multiSelect') {
    const ids = parseMultiSelectValue(value)
    if (ids.length === 0) return '—'
    return ids.map((id) => resolveOptionLabel(question, id)).join(', ')
  }

  return value
}

export interface ExportSurveyFillQuestionsExcelOptions {
  answers: Record<string, string>
  answerTypeLookup?: AnswerTypeKindLookup
  manualEntryByKey?: Record<string, boolean>
  ekiciAdi?: string
  anketAdi?: string
  sablonAdi?: string
}

export function exportSurveyFillQuestionsToExcel(
  questions: AnketYanitSoruDto[],
  {
    answers,
    answerTypeLookup,
    manualEntryByKey = {},
    ekiciAdi,
    anketAdi,
    sablonAdi,
  }: ExportSurveyFillQuestionsExcelOptions,
): void {
  const questionsById = new Map(questions.map((question) => [question.soruId, question]))

  const sheetRows = questions.map((question) => {
    const key = getQuestionKey(question)
    const kind = resolveEffectiveQuestionInputKind(
      question,
      answerTypeLookup,
      manualEntryByKey[key] ?? false,
    )
    const displayNumber = getQuestionDisplayNumber(questions, question)
    const parent =
      question.bagliOlduguSoruId != null
        ? questionsById.get(question.bagliOlduguSoruId)
        : undefined

    return {
      Sıra: displayNumber ?? '',
      Soru: getSurveyFillQuestionLabel(question),
      'Alt soru': question.altSoruMetni?.trim() || '',
      'Bağlı soru': question.bagliSoru ? 'Evet' : 'Hayır',
      'Ana soru': parent ? getSurveyFillQuestionLabel(parent) : '',
      'Cevap tipi': question.cevapGirdiTipAdi
        ? getFriendlyAnswerTypeLabel(question.cevapGirdiTipAdi)
        : '',
      Zorunlu: question.zorunlu ? 'Evet' : 'Hayır',
      Cevap: resolveAnswerDisplayValue(question, answers[key] ?? '', kind),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  applyExcelHeaderStyles(worksheet)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anket Soruları')

  const nameParts = [ekiciAdi, anketAdi, sablonAdi]
    .map((value) => value?.trim())
    .filter(Boolean)
    .map((value) => sanitizeFilenamePart(value!))
  const namePart = nameParts.length > 0 ? `-${nameParts.join('-')}` : ''
  const filename = `anket-sorulari${namePart}-${formatExportDate()}.xlsx`

  XLSX.writeFile(workbook, filename, { cellStyles: true })
}
