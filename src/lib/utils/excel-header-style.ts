import * as XLSX from 'xlsx-js-style'

/** App primary-500 */
const HEADER_FILL_RGB = '2A8F9E'
const HEADER_FONT_RGB = 'FFFFFF'
const MIN_COL_WIDTH = 14
const MAX_COL_WIDTH = 48
const BASE_HEADER_ROW_PT = 32

function displayLength(value: unknown): number {
  const text = String(value ?? '').trim()
  if (!text) return 0
  return [...text].length
}

function longestWordLength(value: unknown): number {
  const text = String(value ?? '').trim()
  if (!text) return 0
  return text.split(/\s+/).reduce((max, word) => Math.max(max, [...word].length), 0)
}

function columnWidthFor(headerLen: number, longestWord: number, dataLen: number): number {
  const fromHeader = Math.max(headerLen + 2, longestWord + 3)
  const fromData = dataLen + 2
  return Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, fromHeader, fromData))
}

function wrappedLineCount(text: string, colWidth: number): number {
  const trimmed = text.trim()
  if (!trimmed) return 1
  const width = Math.max(1, colWidth)
  const words = trimmed.split(/\s+/)
  let lines = 1
  let current = 0
  for (const word of words) {
    const wordLen = [...word].length
    if (current === 0) {
      current = wordLen
      continue
    }
    if (current + 1 + wordLen <= width) {
      current += 1 + wordLen
    } else {
      lines += 1
      current = wordLen
    }
  }
  return Math.max(1, lines)
}

export function applyExcelHeaderStyles(
  worksheet: XLSX.WorkSheet,
  options?: { headerRows?: number },
): void {
  const ref = worksheet['!ref']
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)
  const headerRows = Math.max(1, options?.headerRows ?? 1)
  const lastHeaderRow = Math.min(range.s.r + headerRows - 1, range.e.r)
  const colCount = range.e.c - range.s.c + 1

  const headerLenByCol = Array.from({ length: colCount }, () => 0)
  const longestWordByCol = Array.from({ length: colCount }, () => 0)
  const dataLenByCol = Array.from({ length: colCount }, () => 0)

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const isHeader = row <= lastHeaderRow
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const index = col - range.s.c
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = worksheet[address]
      if (!cell) continue

      const length = displayLength(cell.v)
      if (isHeader) {
        headerLenByCol[index] = Math.max(headerLenByCol[index], length)
        longestWordByCol[index] = Math.max(longestWordByCol[index], longestWordLength(cell.v))
        cell.s = {
          ...(typeof cell.s === 'object' && cell.s ? cell.s : {}),
          fill: {
            patternType: 'solid',
            fgColor: { rgb: HEADER_FILL_RGB },
          },
          font: {
            bold: true,
            color: { rgb: HEADER_FONT_RGB },
            sz: 11,
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true,
          },
        }
      } else {
        dataLenByCol[index] = Math.max(dataLenByCol[index], Math.min(length, MAX_COL_WIDTH))
      }
    }
  }

  worksheet['!cols'] = Array.from({ length: colCount }, (_, index) => ({
    wch: columnWidthFor(headerLenByCol[index], longestWordByCol[index], dataLenByCol[index]),
  }))

  const rows = worksheet['!rows'] ? [...worksheet['!rows']] : []
  for (let row = range.s.r; row <= lastHeaderRow; row += 1) {
    let lines = 1
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      const text = String(worksheet[address]?.v ?? '')
      const colWidth = worksheet['!cols']?.[col - range.s.c]?.wch ?? MIN_COL_WIDTH
      lines = Math.max(lines, wrappedLineCount(text, colWidth))
    }
    rows[row] = { ...(rows[row] ?? {}), hpt: Math.max(BASE_HEADER_ROW_PT, 16 * lines + 10) }
  }
  worksheet['!rows'] = rows
}
