import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import type { QuestionDto } from '@/features/questions/types/question.types'
import { FIXED_COLUMNS } from '../config/anket-cevaplari'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import {
  groupAnketCevapSoruColumns,
  resolveAnketCevapSoruColumns,
} from './anket-cevap-soru-headers'
import { formatAnketCevapCell } from './format-anket-cevap-cell'
import { getVisibleSoruKolonlari } from './visible-soru-kolonlari'

function formatExportDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface ExportAnketCevaplariExcelOptions {
  questions?: QuestionDto[]
  optionNameById?: ReadonlyMap<number, string>
}

export function exportAnketCevaplariToExcel(
  soruKolonlari: string[],
  satirlar: AnketCevapRow[],
  { questions = [], optionNameById = new Map() }: ExportAnketCevaplariExcelOptions = {},
): void {
  const visibleSoruKolonlari = getVisibleSoruKolonlari(soruKolonlari)
  const soruColumns = resolveAnketCevapSoruColumns(visibleSoruKolonlari, questions, optionNameById)
  const groups = groupAnketCevapSoruColumns(soruColumns)

  const headerRow0: string[] = []
  const headerRow1: string[] = []
  const merges: XLSX.Range[] = []

  FIXED_COLUMNS.forEach((column, index) => {
    headerRow0[index] = column.header
    headerRow1[index] = ''
    merges.push({ s: { r: 0, c: index }, e: { r: 1, c: index } })
  })

  let col = FIXED_COLUMNS.length
  for (const group of groups) {
    const start = col
    const hasChildren = group.columns.some((column) => column.isChild)

    if (!hasChildren && group.columns.length === 1) {
      headerRow0[col] = group.columns[0].header
      headerRow1[col] = ''
      merges.push({ s: { r: 0, c: col }, e: { r: 1, c: col } })
      col += 1
      continue
    }

    for (const column of group.columns) {
      headerRow0[col] = group.parentHeader
      headerRow1[col] = column.isChild ? column.subHeader : 'Cevap'
      col += 1
    }

    if (col - 1 > start) {
      merges.push({ s: { r: 0, c: start }, e: { r: 0, c: col - 1 } })
    }
  }

  const body = satirlar.map((row) => [
    ...FIXED_COLUMNS.map((column) => row[column.key] ?? ''),
    ...soruColumns.map((column) => formatAnketCevapCell(column.header, row.cevaplar[column.index])),
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow0, headerRow1, ...body])
  worksheet['!merges'] = merges
  applyExcelHeaderStyles(worksheet, { headerRows: 2 })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anket Cevapları')

  XLSX.writeFile(workbook, `anket-cevaplari-${formatExportDate()}.xlsx`, { cellStyles: true })
}
