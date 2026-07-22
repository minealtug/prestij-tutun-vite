import * as XLSX from 'xlsx-js-style'

import {
  AGE_RANGES,
  ROW_HEADERS,
  SOURCE_GROUPS,
  cellKey,
  type HamVeriPivotRow,
} from '../config/ham-veri-report'

const HEADER_FILL_RGB = '2A8F9E'
const HEADER_FONT_RGB = 'FFFFFF'
const TOTAL_FILL_RGB = 'E6F3F5'

const GROUP_START_COL = ROW_HEADERS.length
const GROUP_WIDTH = AGE_RANGES.length * 3 + 1

type Cell = XLSX.CellObject

function textCell(value: string, bold = false, center = true): Cell {
  return {
    t: 's',
    v: value,
    s: {
      font: { bold },
      alignment: { horizontal: center ? 'center' : 'left', vertical: 'center', wrapText: true },
      border: thinBorder(),
    },
  }
}

function headerCell(value: string): Cell {
  return {
    t: 's',
    v: value,
    s: {
      fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL_RGB } },
      font: { bold: true, color: { rgb: HEADER_FONT_RGB } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thinBorder(),
    },
  }
}

function numberCell(value: number, opts?: { total?: boolean }): Cell {
  return {
    t: 'n',
    v: value,
    s: {
      font: { bold: Boolean(opts?.total) },
      fill: opts?.total
        ? { patternType: 'solid', fgColor: { rgb: TOTAL_FILL_RGB } }
        : undefined,
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder(),
    },
  }
}

function thinBorder() {
  const side = { style: 'thin' as const, color: { rgb: 'CCCCCC' } }
  return { top: side, bottom: side, left: side, right: side }
}

function groupStartCol(groupIndex: number): number {
  return GROUP_START_COL + groupIndex * GROUP_WIDTH
}

function buildHeader(matrix: Cell[][], merges: XLSX.Range[]): void {
  const row0: Cell[] = []
  const row1: Cell[] = []
  const row2: Cell[] = []

  ROW_HEADERS.forEach((header, c) => {
    row0[c] = headerCell(header)
    row1[c] = headerCell('')
    row2[c] = headerCell('')
    merges.push({ s: { r: 0, c }, e: { r: 2, c } })
  })

  SOURCE_GROUPS.forEach((group, gi) => {
    const start = groupStartCol(gi)
    row0[start] = headerCell(group.label)
    merges.push({ s: { r: 0, c: start }, e: { r: 0, c: start + GROUP_WIDTH - 1 } })

    AGE_RANGES.forEach((range, ri) => {
      const base = start + ri * 3
      row1[base] = headerCell(range)
      row1[base + 1] = headerCell('')
      merges.push({ s: { r: 1, c: base }, e: { r: 1, c: base + 1 } })

      row1[base + 2] = headerCell(`${range} Toplam`)
      row2[base + 2] = headerCell('')
      merges.push({ s: { r: 1, c: base + 2 }, e: { r: 2, c: base + 2 } })

      row2[base] = headerCell('Erkek')
      row2[base + 1] = headerCell('Kadın')
    })

    const totalCol = start + GROUP_WIDTH - 1
    row1[totalCol] = headerCell(group.totalLabel)
    row2[totalCol] = headerCell('')
    merges.push({ s: { r: 1, c: totalCol }, e: { r: 2, c: totalCol } })
  })

  const width = groupStartCol(SOURCE_GROUPS.length)
  for (let c = 0; c < width; c += 1) {
    row0[c] ??= headerCell('')
    row1[c] ??= headerCell('')
    row2[c] ??= headerCell('')
  }

  matrix.push(row0, row1, row2)
}

function buildDataRow(row: HamVeriPivotRow): { cells: Cell[]; totals: number[] } {
  const cells: Cell[] = [
    textCell(row.mensei, false, false),
    textCell(row.bolge, false, false),
    textCell(row.mintika, false, false),
    textCell(row.akimNoktasi, false, false),
  ]

  const columnTotals: number[] = []

  SOURCE_GROUPS.forEach((group, gi) => {
    const start = groupStartCol(gi)
    let groupTotal = 0

    AGE_RANGES.forEach((range, ri) => {
      const base = start + ri * 3
      const cell = row.cells[cellKey(group.key, range)] ?? { erkek: 0, kadin: 0 }
      const rangeTotal = cell.erkek + cell.kadin
      groupTotal += rangeTotal

      cells[base] = numberCell(cell.erkek)
      cells[base + 1] = numberCell(cell.kadin)
      cells[base + 2] = numberCell(rangeTotal, { total: true })

      columnTotals[base] = (columnTotals[base] ?? 0) + cell.erkek
      columnTotals[base + 1] = (columnTotals[base + 1] ?? 0) + cell.kadin
      columnTotals[base + 2] = (columnTotals[base + 2] ?? 0) + rangeTotal
    })

    const totalCol = start + GROUP_WIDTH - 1
    cells[totalCol] = numberCell(groupTotal, { total: true })
    columnTotals[totalCol] = (columnTotals[totalCol] ?? 0) + groupTotal
  })

  return { cells, totals: columnTotals }
}

function columnWidths(): XLSX.ColInfo[] {
  const widths: XLSX.ColInfo[] = ROW_HEADERS.map(() => ({ wch: 16 }))
  for (let c = GROUP_START_COL; c < groupStartCol(SOURCE_GROUPS.length); c += 1) {
    widths[c] = { wch: 10 }
  }
  return widths
}

function formatExportDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function exportHamVeriReportToExcel(title: string, rows: HamVeriPivotRow[]): void {
  const matrix: Cell[][] = []
  const merges: XLSX.Range[] = []

  buildHeader(matrix, merges)

  const grandTotals: number[] = []
  rows.forEach((row) => {
    const { cells, totals } = buildDataRow(row)
    matrix.push(cells)
    totals.forEach((value, index) => {
      grandTotals[index] = (grandTotals[index] ?? 0) + (value ?? 0)
    })
  })

  const totalRow: Cell[] = [textCell('Genel Toplam', true, false)]
  for (let c = 1; c < ROW_HEADERS.length; c += 1) totalRow[c] = textCell('', true)
  merges.push({
    s: { r: matrix.length, c: 0 },
    e: { r: matrix.length, c: ROW_HEADERS.length - 1 },
  })
  for (let c = GROUP_START_COL; c < groupStartCol(SOURCE_GROUPS.length); c += 1) {
    totalRow[c] = numberCell(grandTotals[c] ?? 0, { total: true })
  }
  matrix.push(totalRow)

  const worksheet = XLSX.utils.aoa_to_sheet(matrix)
  worksheet['!merges'] = merges
  worksheet['!cols'] = columnWidths()

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor')

  XLSX.writeFile(workbook, `${slugify(title)}-${formatExportDate()}.xlsx`, {
    cellStyles: true,
  })
}
