import * as XLSX from 'xlsx-js-style'
import type { QuestionDto } from '@/features/questions/types/question.types'
import {
  ANKET_CEVAPLARI_EXCEL_COL_WIDTHS,
  ANKET_CEVAPLARI_EXCEL_DATE_NUMFMT,
  ANKET_CEVAPLARI_EXCEL_FIXED_TITLE_COUNT,
  ANKET_CEVAPLARI_EXCEL_ROW_HEIGHT,
  ANKET_CEVAPLARI_EXCEL_SHEET_NAME,
  ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT,
  excelColumnLetter,
  EXCEL_STYLE_DATA_GRAY,
  EXCEL_STYLE_DATA_WHITE,
  EXCEL_STYLE_HEADER_INT,
  EXCEL_STYLE_HEADER_TITLE_FIXED,
  EXCEL_STYLE_HEADER_TITLE_QUESTION,
} from '../config/anket-cevaplari-excel-template'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import {
  ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT,
  buildAnketCevapExcelSheetColumns,
  type AnketCevapExcelSheetColumn,
} from './build-anket-cevap-excel-columns'
import { formatAnketCevapCell } from './format-anket-cevap-cell'
import { formatExcelDateText, resolveAnketCevapExcelCell, type ExcelCellValue } from './map-anket-cevap-excel-values'

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

function headerStyle() {
  return EXCEL_STYLE_HEADER_INT
}

function titleStyle(colIndex: number) {
  return colIndex < ANKET_CEVAPLARI_EXCEL_FIXED_TITLE_COUNT
    ? EXCEL_STYLE_HEADER_TITLE_FIXED
    : EXCEL_STYLE_HEADER_TITLE_QUESTION
}

function dataStyle(column: AnketCevapExcelSheetColumn) {
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

function questionWidth(title: string): number {
  return Math.min(60, Math.max(14, Math.ceil(title.length * 1.05)))
}

function columnWidths(columns: AnketCevapExcelSheetColumn[]): number[] {
  return columns.map((column, index) => {
    if (index < ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT) {
      return ANKET_CEVAPLARI_EXCEL_COL_WIDTHS[index] ?? 14
    }
    return questionWidth(column.title)
  })
}

function sheetCellValue(column: AnketCevapExcelSheetColumn, row: AnketCevapRow): ExcelCellValue {
  if (column.fixed) return resolveAnketCevapExcelCell(column.fixed, row, [])
  const raw =
    column.answerIndex != null && column.answerIndex >= 0 ? row.cevaplar[column.answerIndex] : ''
  const text = formatAnketCevapCell(column.answerHeader ?? column.title, raw)
  if (!text) return null
  if (column.valueKind === 'dateText') return formatExcelDateText(text)
  return text
}

function writeHeaderRows(worksheet: XLSX.WorkSheet, columns: AnketCevapExcelSheetColumn[]): void {
  columns.forEach((column, col) => {
    const numberValue = column.row1
    setCell(
      worksheet,
      0,
      col,
      numberValue,
      headerStyle(),
      typeof numberValue === 'string' ? ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT : undefined,
      typeof numberValue === 'number' ? 'n' : 's',
    )

    const titleFmt = col < ANKET_CEVAPLARI_EXCEL_FIXED_TITLE_COUNT ? ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT : undefined
    setCell(worksheet, 1, col, column.title, titleStyle(col), titleFmt)
  })
}

function writeDataRow(
  worksheet: XLSX.WorkSheet,
  excelRow: number,
  row: AnketCevapRow,
  columns: AnketCevapExcelSheetColumn[],
): void {
  columns.forEach((column, col) => {
    const value = sheetCellValue(column, row)
    const numFmt =
      column.valueKind === 'dateExcel'
        ? ANKET_CEVAPLARI_EXCEL_DATE_NUMFMT
        : column.dataStyle === 'white' ||
            column.fixed?.letter === 'F' ||
            (col < ANKET_CEVAPLARI_EXCEL_FIXED_TITLE_COUNT && column.valueKind !== 'number')
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
  }: ExportAnketCevaplariExcelOptions = {},
): void {
  const columns = buildAnketCevapExcelSheetColumns(soruKolonlari, questions, optionNameById)
  const colCount = columns.length
  const lastColLetter = excelColumnLetter(colCount - 1)
  const lastRow = 1 + satirlar.length
  const worksheet: XLSX.WorkSheet = {}

  writeHeaderRows(worksheet, columns)
  satirlar.forEach((row, index) => {
    writeDataRow(worksheet, index + 2, row, columns)
  })

  worksheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: colCount - 1 },
  })
  worksheet['!cols'] = columnWidths(columns).map((wch) => ({ wch }))
  worksheet['!rows'] = Array.from({ length: lastRow + 1 }, () => ({
    hpt: ANKET_CEVAPLARI_EXCEL_ROW_HEIGHT,
  }))
  worksheet['!autofilter'] = {
    ref: `A2:${lastColLetter}${Math.max(2, lastRow + 1)}`,
  }
  worksheet['!views'] = [{ showGridLines: false }]
  worksheet['!margins'] = { left: 1, right: 1, top: 1, bottom: 1, header: 0.3, footer: 0.3 }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, ANKET_CEVAPLARI_EXCEL_SHEET_NAME)
  XLSX.writeFile(workbook, `anket-cevaplari-${formatExportDate()}.xlsx`, { cellStyles: true })
}
