import * as XLSX from 'xlsx-js-style'
import type { QuestionDto } from '@/features/questions/types/question.types'
import type { SecenekGrupDto } from '@/features/option-groups/types/option-group.types'
import {
  ANKET_CEVAPLARI_EXCEL_COLUMNS,
  type AnketCevapExcelColumn,
} from '../config/anket-cevaplari-excel-columns'
import {
  ANKET_CEVAPLARI_EXCEL_COL_COUNT,
  ANKET_CEVAPLARI_EXCEL_COL_WIDTHS,
  ANKET_CEVAPLARI_EXCEL_DATE_NUMFMT,
  ANKET_CEVAPLARI_EXCEL_MERGES,
  ANKET_CEVAPLARI_EXCEL_ROW_HEIGHT,
  ANKET_CEVAPLARI_EXCEL_SHEET_NAME,
  ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT,
  EXCEL_STYLE_DATA_GRAY,
  EXCEL_STYLE_DATA_WHITE,
  EXCEL_STYLE_HEADER_DECIMAL,
  EXCEL_STYLE_HEADER_INT,
  EXCEL_STYLE_HEADER_TITLE_FIXED,
  EXCEL_STYLE_HEADER_TITLE_QUESTION,
} from '../config/anket-cevaplari-excel-template'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import { buildAnketCevapExcelSources } from './anket-cevap-excel-source'
import { resolveAnketCevapExcelCell, type ExcelCellValue } from './map-anket-cevap-excel-values'

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
  optionGroups?: SecenekGrupDto[]
}

function buildOptionOrder(groups: SecenekGrupDto[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const group of groups) {
    for (const option of group.altSecenekler) {
      const key = option.adi.trim().toLocaleLowerCase('tr-TR')
      if (!key || map.has(key)) continue
      map.set(key, option.siraNo)
    }
  }
  return map
}

function headerStyle(column: AnketCevapExcelColumn) {
  if (column.row1Kind === 'decimal' || column.row1Kind === 'decimalEmpty') return EXCEL_STYLE_HEADER_DECIMAL
  return EXCEL_STYLE_HEADER_INT
}

function titleStyle(colIndex: number) {
  return colIndex < 12 ? EXCEL_STYLE_HEADER_TITLE_FIXED : EXCEL_STYLE_HEADER_TITLE_QUESTION
}

function dataStyle(column: AnketCevapExcelColumn) {
  if (column.dataStyle === 'white') return EXCEL_STYLE_DATA_WHITE
  return EXCEL_STYLE_DATA_GRAY
}

function setCell(
  worksheet: XLSX.WorkSheet,
  row: number,
  col: number,
  value: ExcelCellValue,
  style: object,
  numFmt?: string,
  type?: 's' | 'n',
): void {
  const address = XLSX.utils.encode_cell({ r: row, c: col })
  if (value == null || value === '') {
    worksheet[address] = { t: 's', v: '', s: style, z: numFmt }
    return
  }
  if (typeof value === 'number' || type === 'n') {
    worksheet[address] = { t: 'n', v: value, s: style, z: numFmt }
    return
  }
  worksheet[address] = { t: 's', v: String(value), s: style, z: numFmt }
}

function writeHeaderRows(worksheet: XLSX.WorkSheet): void {
  ANKET_CEVAPLARI_EXCEL_COLUMNS.forEach((column, col) => {
    if (column.row1Kind !== 'none') {
      const value = column.row1Kind === 'decimalEmpty' ? null : (column.row1Value ?? null)
      setCell(
        worksheet,
        0,
        col,
        value,
        headerStyle(column),
        undefined,
        value == null ? 's' : 'n',
      )
    }

    const titleFmt = col < 12 ? ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT : undefined
    setCell(worksheet, 1, col, column.title, titleStyle(col), titleFmt)
  })
}

function writeDataRow(
  worksheet: XLSX.WorkSheet,
  excelRow: number,
  row: AnketCevapRow,
  sources: ReturnType<typeof buildAnketCevapExcelSources>,
  optionOrder: Map<string, number>,
): void {
  ANKET_CEVAPLARI_EXCEL_COLUMNS.forEach((column, col) => {
    const value = resolveAnketCevapExcelCell(column, row, sources, optionOrder)
    const numFmt =
      column.valueKind === 'dateExcel'
        ? ANKET_CEVAPLARI_EXCEL_DATE_NUMFMT
        : column.dataStyle === 'white' || column.letter === 'F' || (col < 12 && column.valueKind !== 'number')
          ? ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT
          : undefined
    const type = column.valueKind === 'number' || column.valueKind === 'dateExcel' ? 'n' : 's'
    setCell(worksheet, excelRow, col, value, dataStyle(column), numFmt, type)
  })
}

export function exportAnketCevaplariToExcel(
  soruKolonlari: string[],
  satirlar: AnketCevapRow[],
  {
    questions = [],
    optionNameById = new Map(),
    optionGroups = [],
  }: ExportAnketCevaplariExcelOptions = {},
): void {
  const sources = buildAnketCevapExcelSources(soruKolonlari, questions, optionNameById)
  const optionOrder = buildOptionOrder(optionGroups)
  const lastRow = 1 + satirlar.length
  const worksheet: XLSX.WorkSheet = {}

  writeHeaderRows(worksheet)
  satirlar.forEach((row, index) => {
    writeDataRow(worksheet, index + 2, row, sources, optionOrder)
  })

  worksheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: ANKET_CEVAPLARI_EXCEL_COL_COUNT - 1 },
  })
  worksheet['!merges'] = ANKET_CEVAPLARI_EXCEL_MERGES
  worksheet['!cols'] = ANKET_CEVAPLARI_EXCEL_COL_WIDTHS.map((wch) => ({ wch }))
  worksheet['!rows'] = Array.from({ length: lastRow + 1 }, () => ({
    hpt: ANKET_CEVAPLARI_EXCEL_ROW_HEIGHT,
  }))
  worksheet['!autofilter'] = {
    ref: `A2:CW${Math.max(2, lastRow + 1)}`,
  }
  worksheet['!views'] = [{ showGridLines: false }]
  worksheet['!margins'] = { left: 1, right: 1, top: 1, bottom: 1, header: 0.3, footer: 0.3 }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, ANKET_CEVAPLARI_EXCEL_SHEET_NAME)
  XLSX.writeFile(workbook, `anket-cevaplari-${formatExportDate()}.xlsx`, { cellStyles: true })
}
