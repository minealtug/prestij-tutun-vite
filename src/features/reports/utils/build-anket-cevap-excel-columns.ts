import type { QuestionDto } from '@/features/questions/types/question.types'
import { getQuestionDisplayMeta, sortQuestionsForSurvey } from '@/features/questions/utils/sort-questions'
import {
  ANKET_CEVAPLARI_EXCEL_COLUMNS,
  type AnketCevapExcelColumn,
  type ExcelDataStyle,
  type ExcelValueKind,
} from '../config/anket-cevaplari-excel-columns'
import {
  resolveAnketCevapSoruColumns,
  type AnketCevapSoruColumn,
} from './anket-cevap-soru-headers'
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

function outlineCell(outline: string): number | string | null {
  if (!outline) return null
  if (/^\d+(\.\d+)?$/.test(outline)) return Number(outline)
  return outline
}

function excelQuestionTitle(column: AnketCevapSoruColumn): string {
  if (column.isChild) return column.subHeader || column.header
  return column.header
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
  const display = getQuestionDisplayMeta(orderedQuestions)
  const questionById = new Map(orderedQuestions.map((question) => [String(question.id), question]))

  const dynamic = labeled.map((column) => {
    const question =
      column.questionId != null ? questionById.get(String(column.questionId)) : undefined
    const outline =
      column.questionId != null ? (display.get(String(column.questionId))?.outline ?? '') : ''
    const header = column.header

    return {
      title: excelQuestionTitle(column),
      row1: outlineCell(outline),
      valueKind: isDateQuestion(question, header) ? ('dateText' as const) : ('text' as const),
      dataStyle: 'white' as const,
      answerIndex: column.index,
      answerHeader: header,
    }
  })

  return [...fixed, ...dynamic]
}
