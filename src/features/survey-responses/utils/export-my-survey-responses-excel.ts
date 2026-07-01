import * as XLSX from 'xlsx-js-style'
import type { AnketCevapOzetItem } from '../types/survey-response.types'
import {
  getOzetFullName,
  getOzetKullaniciAdi,
  getOzetSurveyName,
} from '../types/survey-response.types'
import {
  applySurveyResponseRowFills,
  getSurveyResponseExcelFillRgb,
} from './excel-survey-response-row-fill'
import { formatSonIslemTarihi } from './map-anket-cevap'

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

export interface ExportMySurveyResponsesExcelOptions {
  anketFilter?: string
  ekiciFilter?: string
}

export function exportMySurveyResponsesToExcel(
  rows: AnketCevapOzetItem[],
  { anketFilter, ekiciFilter }: ExportMySurveyResponsesExcelOptions = {},
): void {
  const sheetRows = rows.map((row) => ({
    Tarih: formatSonIslemTarihi(row.sonIslemTarihi),
    Kullanıcı: getOzetKullaniciAdi(row),
    'Adı Soyadı': getOzetFullName(row),
    Anket: getOzetSurveyName(row),
    Yanıtlanan: Math.max(0, row.yanitlananSoruSayisi),
    Yanıtlanmayan: Math.max(0, row.yanitlanmayanSoruSayisi),
  }))

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  applySurveyResponseRowFills(
    worksheet,
    rows.map((row) => getSurveyResponseExcelFillRgb(row)),
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cevapladığım Anketler')

  const filterParts = [anketFilter, ekiciFilter]
    .map((value) => value?.trim())
    .filter(Boolean)
    .map((value) => sanitizeFilenamePart(value!))
  const filterPart = filterParts.length > 0 ? `-${filterParts.join('-')}` : ''
  const filename = `cevapladigim-anketler${filterPart}-${formatExportDate()}.xlsx`

  XLSX.writeFile(workbook, filename, { cellStyles: true })
}
