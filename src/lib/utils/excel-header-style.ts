import * as XLSX from 'xlsx-js-style'

/** App primary-500 */
const HEADER_FILL_RGB = '2A8F9E'
const HEADER_FONT_RGB = 'FFFFFF'

export function applyExcelHeaderStyles(worksheet: XLSX.WorkSheet): void {
  const ref = worksheet['!ref']
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)
  const headerRow = range.s.r

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const address = XLSX.utils.encode_cell({ r: headerRow, c: col })
    const cell = worksheet[address]
    if (!cell) continue

    cell.s = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: HEADER_FILL_RGB },
      },
      font: {
        bold: true,
        color: { rgb: HEADER_FONT_RGB },
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
    }
  }
}
