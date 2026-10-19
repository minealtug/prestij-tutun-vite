import type { QuestionDto } from '@/features/questions/types/question.types'
import { getQuestionDisplayMeta, sortQuestionsForSurvey } from '@/features/questions/utils/sort-questions'
import {
  ANKET_CEVAPLARI_EXCEL_COLUMNS,
  type AnketCevapExcelColumn,
  type ExcelDataStyle,
  type ExcelValueKind,
} from '../config/anket-cevaplari-excel-columns'
import { resolveAnketCevapSoruColumns } from './anket-cevap-soru-headers'
import { getVisibleSoruKolonlari } from './visible-soru-kolonlari'

/** Anket Adı … Ekici Yaş Aralığı. Soru sütunları bu bloktan sonra gelir. */
export const ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT = 11

export interface AnketCevapExcelSheetColumn {
  title: string
  row1: number | string | null
  valueKind: ExcelValueKind
  dataStyle: ExcelDataStyle
  fixed?: AnketCevapExcelColumn
  answerIndex?: number
  answerHeader?: string
}

function fixedRow1(column: AnketCevapExcelColumn): number | null {
  if (column.row1Kind === 'none' || column.row1Kind === 'decimalEmpty') return null
  return column.row1Value ?? null
}

function outlineCell(outline: string): string | null {
  if (!outline) return null
  // 2.20 sayıya çevrilirse 2,2 olur; 20. alt soru ile 2. alt soru karışır.
  return outline.replaceAll('.', ',')
}

function stripLeadingAnswer(header: string, optionNames: readonly string[]): string {
  const names = new Set(
    optionNames.map((name) => name.trim().toLocaleLowerCase('tr-TR')).filter((name) => name.length > 0),
  )
  let text = header.trim()
  while (names.size > 0 && text.includes('—')) {
    const separator = text.indexOf('—')
    const prefix = text.slice(0, separator).trim().toLocaleLowerCase('tr-TR')
    const rest = text.slice(separator + 1).trim()
    if (!rest || !names.has(prefix)) break
    text = rest
  }
  return text
}

function excelQuestionTitle(
  header: string,
  question: QuestionDto | undefined,
  optionNames: readonly string[],
): string {
  const questionText = question?.soruMetni?.trim()
  return stripLeadingAnswer(questionText || header, optionNames)
}

function isDateQuestion(question: QuestionDto | undefined, header: string): boolean {
  const tip = `${question?.cevapGirdiTipAdi ?? ''} ${question?.cevapGirdiTip?.adi ?? ''}`.toLocaleLowerCase(
    'tr-TR',
  )
  if (tip.includes('tarih') || tip.includes('date')) return true
  const normalized = header.toLocaleLowerCase('tr-TR')
  return normalized.includes('doğum') || normalized.includes('dogum')
}

export function buildAnketCevapExcelSheetColumns(
  soruKolonlari: string[],
  questions: QuestionDto[] = [],
  optionNameById: ReadonlyMap<number, string> = new Map(),
): AnketCevapExcelSheetColumn[] {
  const fixed = ANKET_CEVAPLARI_EXCEL_COLUMNS.slice(0, ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT).map(
    (column) => ({
      title: column.title,
      row1: fixedRow1(column),
      valueKind: column.valueKind,
      dataStyle: column.dataStyle,
      fixed: column,
    }),
  )

  const orderedQuestions = questions.length > 0 ? sortQuestionsForSurvey(questions) : []
  const visible = getVisibleSoruKolonlari(soruKolonlari, orderedQuestions)
  const labeled = resolveAnketCevapSoruColumns(visible, orderedQuestions, optionNameById)
  const optionNames = [...optionNameById.values()]
  const display = getQuestionDisplayMeta(orderedQuestions)
  const questionById = new Map(orderedQuestions.map((question) => [String(question.id), question]))

  const dynamic = labeled.map((column) => {
    const question =
      column.questionId != null ? questionById.get(String(column.questionId)) : undefined
    const outline =
      column.questionId != null ? (display.get(String(column.questionId))?.outline ?? '') : ''
    const header = column.header

    return {
      title: excelQuestionTitle(column.header, question, optionNames),
      row1: outlineCell(outline),
      valueKind: isDateQuestion(question, header) ? ('dateText' as const) : ('text' as const),
      dataStyle: 'white' as const,
      answerIndex: column.index,
      answerHeader: header,
    }
  })

  return [...fixed, ...dynamic]
}
