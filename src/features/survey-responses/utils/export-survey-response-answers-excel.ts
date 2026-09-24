import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import type { QuestionDto } from '@/features/questions/types/question.types'
import { UNANSWERED_ANSWER_LABEL, type SoruCevapDisplay } from '../types/survey-response.types'
import {
  collectLabeledDescendants,
  filterDuplicateKontratSahibiAnswers,
} from './format-linked-answer-label'

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

function normalizeCevapForExport(soru: Pick<SoruCevapDisplay, 'cevapMetni' | 'yanitlandi'>): string {
  const normalizedCevap = soru.cevapMetni?.trim() ?? ''
  const isUnanswered =
    !soru.yanitlandi ||
    normalizedCevap === UNANSWERED_ANSWER_LABEL ||
    normalizedCevap === '' ||
    normalizedCevap === '-'

  return isUnanswered ? UNANSWERED_ANSWER_LABEL : soru.cevapMetni
}

function alignMergedCells(worksheet: XLSX.WorkSheet, merges: XLSX.Range[]) {
  for (const range of merges) {
    const address = XLSX.utils.encode_cell(range.s)
    const cell = worksheet[address]
    if (!cell || typeof cell !== 'object') continue
    cell.s = {
      ...(typeof cell.s === 'object' && cell.s ? cell.s : {}),
      alignment: { vertical: 'center', wrapText: true },
    }
  }
}

export interface ExportSurveyResponseAnswersExcelOptions {
  ekiciAdi?: string
  anketAdi?: string
  kategoriAdi?: string
  questions?: QuestionDto[]
  optionNameById?: ReadonlyMap<number, string>
}

export function exportSurveyResponseAnswersToExcel(
  roots: SoruCevapDisplay[],
  {
    ekiciAdi,
    anketAdi,
    kategoriAdi = 'Genel',
    questions = [],
    optionNameById = new Map(),
  }: ExportSurveyResponseAnswersExcelOptions = {},
): void {
  const questionsById = new Map(questions.map((question) => [Number(question.id), question]))
  const visibleRoots = filterDuplicateKontratSahibiAnswers(roots)
  const labeled = visibleRoots.map((node) => ({
    node,
    children: collectLabeledDescendants(node, questionsById, optionNameById),
  }))

  const header = ['Kategori', 'Soru', 'Cevap', 'Bağlı soru', 'Bağlı cevap']
  const body: string[][] = []
  const merges: XLSX.Range[] = []
  let excelRow = 1

  for (const item of labeled) {
    const parentCevap = normalizeCevapForExport(item.node)
    const children = item.children

    if (children.length === 0) {
      body.push([kategoriAdi, item.node.soruMetni, parentCevap, '', ''])
      excelRow += 1
      continue
    }

    const start = excelRow
    children.forEach((child, index) => {
      body.push([
        index === 0 ? kategoriAdi : '',
        index === 0 ? item.node.soruMetni : '',
        index === 0 ? parentCevap : '',
        child.label,
        normalizeCevapForExport(child.node),
      ])
      excelRow += 1
    })

    if (children.length > 1) {
      merges.push({ s: { r: start, c: 0 }, e: { r: excelRow - 1, c: 0 } })
      merges.push({ s: { r: start, c: 1 }, e: { r: excelRow - 1, c: 1 } })
      merges.push({ s: { r: start, c: 2 }, e: { r: excelRow - 1, c: 2 } })
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  worksheet['!merges'] = merges
  applyExcelHeaderStyles(worksheet)
  alignMergedCells(worksheet, merges)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anket Cevapları')

  const nameParts = [ekiciAdi, anketAdi]
    .map((value) => value?.trim())
    .filter(Boolean)
    .map((value) => sanitizeFilenamePart(value!))
  const namePart = nameParts.length > 0 ? `-${nameParts.join('-')}` : ''
  const filename = `anket-cevaplari${namePart}-${formatExportDate()}.xlsx`

  XLSX.writeFile(workbook, filename, { cellStyles: true })
}
