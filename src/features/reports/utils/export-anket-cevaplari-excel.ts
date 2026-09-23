import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import { FIXED_COLUMNS } from '../config/anket-cevaplari'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import { formatAnketCevapCell } from './format-anket-cevap-cell'
import { getVisibleSoruKolonlari } from './visible-soru-kolonlari'

function formatExportDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function exportAnketCevaplariToExcel(
  soruKolonlari: string[],
  satirlar: AnketCevapRow[],
): void {
  const visibleSoruKolonlari = getVisibleSoruKolonlari(soruKolonlari)
  const header = [...FIXED_COLUMNS.map((c) => c.header), ...visibleSoruKolonlari.map((c) => c.header)]

  const body = satirlar.map((row) => [
    ...FIXED_COLUMNS.map((c) => row[c.key] ?? ''),
    ...visibleSoruKolonlari.map((col) => formatAnketCevapCell(col.header, row.cevaplar[col.index])),
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  applyExcelHeaderStyles(worksheet)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anket Cevapları')

  XLSX.writeFile(workbook, `anket-cevaplari-${formatExportDate()}.xlsx`, { cellStyles: true })
}
