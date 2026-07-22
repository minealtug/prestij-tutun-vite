import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import { FIXED_COLUMNS } from '../config/anket-cevaplari'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'

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
  const header = [...FIXED_COLUMNS.map((c) => c.header), ...soruKolonlari]

  const body = satirlar.map((row) => [
    ...FIXED_COLUMNS.map((c) => row[c.key] ?? ''),
    ...soruKolonlari.map((_, i) => row.cevaplar[i] ?? ''),
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  applyExcelHeaderStyles(worksheet)

  worksheet['!cols'] = header.map((h) => ({ wch: Math.min(40, Math.max(12, h.length + 2)) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anket Cevapları')

  XLSX.writeFile(workbook, `anket-cevaplari-${formatExportDate()}.xlsx`, { cellStyles: true })
}
