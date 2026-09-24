import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import { UNANSWERED_ANSWER_LABEL, type SoruCevapDisplay } from '../types/survey-response.types'

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

function collectDescendants(node: SoruCevapDisplay): SoruCevapDisplay[] {
  const result: SoruCevapDisplay[] = []
  for (const child of node.children) {
    result.push(child)
    result.push(...collectDescendants(child))
  }
  return result
}

export interface ExportSurveyResponseAnswersExcelOptions {
  ekiciAdi?: string
  anketAdi?: string
  kategoriAdi?: string
}

export function exportSurveyResponseAnswersToExcel(
  roots: SoruCevapDisplay[],
  { ekiciAdi, anketAdi, kategoriAdi = 'Genel' }: ExportSurveyResponseAnswersExcelOptions = {},
): void {
  const maxChildren = roots.reduce((max, node) => Math.max(max, collectDescendants(node).length), 0)
  const header = ['Kategori', 'Soru', 'Cevap']
  for (let index = 0; index < maxChildren; index += 1) {
    header.push(`Bağlı soru ${index + 1}`, `Cevap ${index + 1}`)
  }

  const body = roots.map((node) => {
    const row: string[] = [kategoriAdi, node.soruMetni, normalizeCevapForExport(node)]
    for (const child of collectDescendants(node)) {
      row.push(child.soruMetni, normalizeCevapForExport(child))
    }
    while (row.length < header.length) row.push('')
    return row
  })

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  applyExcelHeaderStyles(worksheet)

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
