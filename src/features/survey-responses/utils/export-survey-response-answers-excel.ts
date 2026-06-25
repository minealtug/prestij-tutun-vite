import * as XLSX from 'xlsx'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import type { FlatSoruCevapRow } from './map-anket-cevap'

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

function normalizeCevapForExport(row: FlatSoruCevapRow): string {
  const normalizedCevap = row.cevapMetni?.trim() ?? ''
  const isUnanswered =
    !row.yanitlandi ||
    normalizedCevap === UNANSWERED_ANSWER_LABEL ||
    normalizedCevap === '' ||
    normalizedCevap === '-'

  return isUnanswered ? UNANSWERED_ANSWER_LABEL : row.cevapMetni
}

export interface ExportSurveyResponseAnswersExcelOptions {
  ekiciAdi?: string
  anketAdi?: string
}

export function exportSurveyResponseAnswersToExcel(
  rows: FlatSoruCevapRow[],
  { ekiciAdi, anketAdi }: ExportSurveyResponseAnswersExcelOptions = {},
): void {
  const sheetRows = rows.map((row) => ({
    Kategori: row.kategori,
    Soru: row.soruMetni,
    Cevap: normalizeCevapForExport(row),
  }))

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anket Cevapları')

  const nameParts = [ekiciAdi, anketAdi]
    .map((value) => value?.trim())
    .filter(Boolean)
    .map((value) => sanitizeFilenamePart(value!))
  const namePart = nameParts.length > 0 ? `-${nameParts.join('-')}` : ''
  const filename = `anket-cevaplari${namePart}-${formatExportDate()}.xlsx`

  XLSX.writeFile(workbook, filename)
}
