import * as XLSX from 'xlsx-js-style'

import { ROW_HEADERS, type YasCinsiyetTabConfig } from '../config/ham-veri-report'
import type {
  YasCinsiyetRow,
  YasCinsiyetTotals,
} from '../types/yas-cinsiyet-report.types'

const HEADER_FILL_RGB = '2A8F9E'
const HEADER_FONT_RGB = 'FFFFFF'
const TOTAL_FILL_RGB = 'E6F3F5'

type Cell = XLSX.CellObject

function thinBorder() {
  const side = { style: 'thin' as const, color: { rgb: 'CCCCCC' } }
  return { top: side, bottom: side, left: side, right: side }
}

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

function numberCell(value: number, total = false): Cell {
  return {
    t: 'n',
    v: value,
    s: {
      font: { bold: total },
      fill: total ? { patternType: 'solid', fgColor: { rgb: TOTAL_FILL_RGB } } : undefined,
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder(),
    },
  }
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

export function exportHamVeriReportToExcel(
  tab: YasCinsiyetTabConfig,
  rows: YasCinsiyetRow[],
  genelToplam: YasCinsiyetTotals,
): void {
  const bands = tab.bands
  const groupStart = ROW_HEADERS.length
  const groupWidth = bands.length * 3 + 1
  const groupTotalCol = groupStart + bands.length * 3
  const lastCol = groupStart + groupWidth - 1

  const matrix: Cell[][] = []
  const merges: XLSX.Range[] = []

  // Başlık (3 satır)
  const row0: Cell[] = []
  const row1: Cell[] = []
  const row2: Cell[] = []

  ROW_HEADERS.forEach((header, c) => {
    row0[c] = headerCell(header)
    row1[c] = headerCell('')
    row2[c] = headerCell('')
    merges.push({ s: { r: 0, c }, e: { r: 2, c } })
  })

  row0[groupStart] = headerCell(tab.sourceLabel)
  merges.push({ s: { r: 0, c: groupStart }, e: { r: 0, c: lastCol } })

  bands.forEach((band, bi) => {
    const base = groupStart + bi * 3
    row1[base] = headerCell(band.label)
    row1[base + 1] = headerCell('')
    merges.push({ s: { r: 1, c: base }, e: { r: 1, c: base + 1 } })

    row1[base + 2] = headerCell(`${band.label} Toplam`)
    row2[base + 2] = headerCell('')
    merges.push({ s: { r: 1, c: base + 2 }, e: { r: 2, c: base + 2 } })

    row2[base] = headerCell('Erkek')
    row2[base + 1] = headerCell('Kadın')
  })

  row1[groupTotalCol] = headerCell(tab.totalLabel)
  row2[groupTotalCol] = headerCell('')
  merges.push({ s: { r: 1, c: groupTotalCol }, e: { r: 2, c: groupTotalCol } })

  for (let c = 0; c <= lastCol; c += 1) {
    row0[c] ??= headerCell('')
    row1[c] ??= headerCell('')
    row2[c] ??= headerCell('')
  }
  matrix.push(row0, row1, row2)

  const buildTotalsCells = (totals: YasCinsiyetTotals): Cell[] => {
    const cells: Cell[] = []
    bands.forEach((band, bi) => {
      const base = groupStart + bi * 3
      const value = totals.bands[band.key] ?? { erkek: 0, kadin: 0, toplam: 0 }
      cells[base] = numberCell(value.erkek)
      cells[base + 1] = numberCell(value.kadin)
      cells[base + 2] = numberCell(value.toplam, true)
    })
    cells[groupTotalCol] = numberCell(totals.grupToplam, true)
    return cells
  }

  rows.forEach((row) => {
    matrix.push([
      textCell(row.menseiAd, false, false),
      textCell(row.bolgeAd, false, false),
      textCell(row.mintikaAd, false, false),
      textCell(row.alimNoktasiAd, false, false),
      ...buildTotalsCells(row),
    ])
  })

  const totalRow: Cell[] = [textCell('Genel Toplam', true, false)]
  for (let c = 1; c < ROW_HEADERS.length; c += 1) totalRow[c] = textCell('', true)
  merges.push({
    s: { r: matrix.length, c: 0 },
    e: { r: matrix.length, c: ROW_HEADERS.length - 1 },
  })
  buildTotalsCells(genelToplam).forEach((cell, index) => {
    totalRow[index] = cell
  })
  matrix.push(totalRow)

  const worksheet = XLSX.utils.aoa_to_sheet(matrix)
  worksheet['!merges'] = merges
  worksheet['!cols'] = [
    ...ROW_HEADERS.map(() => ({ wch: 16 })),
    ...Array.from({ length: groupWidth }, () => ({ wch: 11 })),
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor')

  XLSX.writeFile(workbook, `${slugify(tab.title)}-${formatExportDate()}.xlsx`, {
    cellStyles: true,
  })
}
