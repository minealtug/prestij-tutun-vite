import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import type { MyEkiciTableRow } from '../components/MyEkicilerTable'
import { formatEkiciDisplayText, getEkiciFullNameDisplay } from './format-ekici-display-text'

function formatLocationLabel(value: string | null | undefined, fallbackId?: number): string {
  if (value?.trim()) return formatEkiciDisplayText(value)
  if (fallbackId != null && fallbackId > 0) return `#${fallbackId}`
  return ''
}

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

export interface ExportMyEkicilerExcelOptions {
  anketSelected: boolean
  surveyName?: string
}

export function exportMyEkicilerToExcel(
  rows: MyEkiciTableRow[],
  { anketSelected, surveyName }: ExportMyEkicilerExcelOptions,
): void {
  const sheetRows = rows.map((row) => {
    const record: Record<string, string | number> = {
      Ekici: getEkiciFullNameDisplay(row),
      'TC Kimlik No': row.tcKimlikNo || '',
      Yıl: row.yil || '',
      Menşei: formatLocationLabel(row.menseiAdi, row.menseiId),
      Bölge: formatLocationLabel(row.bolgeAdi, row.bolgeId),
      Mıntıka: formatLocationLabel(row.mintikaAdi, row.mintikaId),
      'Alım Noktası': formatLocationLabel(row.alimNoktasiAdi, row.alimNoktasiId),
      Köy: formatLocationLabel(row.koyAdi, row.koyId),
      Aktif: row.aktif === 1 ? 'Evet' : 'Hayır',
    }

    if (anketSelected) {
      record['Yanıtlanan'] = row.yanitlananSoruSayisi ?? 0
      record['Yanıtlanmayan'] = row.yanitlanmayanSoruSayisi ?? 0
    }

    return record
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  applyExcelHeaderStyles(worksheet)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ekicilerim')

  const surveyPart = surveyName?.trim() ? `-${sanitizeFilenamePart(surveyName)}` : ''
  const filename = `ekicilerim${surveyPart}-${formatExportDate()}.xlsx`

  XLSX.writeFile(workbook, filename, { cellStyles: true })
}
