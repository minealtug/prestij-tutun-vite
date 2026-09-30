import type * as XLSX from 'xlsx-js-style'

/** bu.xlsx styles.xml: Tahoma 8.25, #201F35, fill #CACBD3 / #FFFFFF, border #808080 */
const FONT = { name: 'Tahoma', sz: 8.25, color: { rgb: '201F35' } }
const GRAY_FILL = { patternType: 'solid' as const, fgColor: { rgb: 'CACBD3' } }
const WHITE_FILL = { patternType: 'solid' as const, fgColor: { rgb: 'FFFFFF' } }
const BORDER_SIDE = { style: 'thin' as const, color: { rgb: '808080' } }
const BORDER = { top: BORDER_SIDE, bottom: BORDER_SIDE, left: BORDER_SIDE, right: BORDER_SIDE }

export const ANKET_CEVAPLARI_EXCEL_SHEET_NAME = 'Sheet'
export const ANKET_CEVAPLARI_EXCEL_COL_COUNT = 101
export const ANKET_CEVAPLARI_EXCEL_DATE_NUMFMT = 'm/d/yy h:mm'
export const ANKET_CEVAPLARI_EXCEL_TEXT_NUMFMT = '@'
export const ANKET_CEVAPLARI_EXCEL_ROW_HEIGHT = 15

function style(fill: typeof GRAY_FILL, horizontal: 'left' | 'right') {
  return {
    font: FONT,
    fill,
    border: BORDER,
    alignment: { horizontal, vertical: 'center' as const, wrapText: false },
  }
}

export const EXCEL_STYLE_HEADER_INT = style(GRAY_FILL, 'left')
export const EXCEL_STYLE_HEADER_DECIMAL = style(GRAY_FILL, 'left')
export const EXCEL_STYLE_HEADER_TITLE_FIXED = style(GRAY_FILL, 'left')
export const EXCEL_STYLE_HEADER_TITLE_QUESTION = style(GRAY_FILL, 'left')
export const EXCEL_STYLE_DATA_GRAY = style(GRAY_FILL, 'left')
export const EXCEL_STYLE_DATA_WHITE = style(WHITE_FILL, 'right')

/** bu.xlsx col/@width converted to character widths */
export const ANKET_CEVAPLARI_EXCEL_COL_WIDTHS: number[] = [
  8.43, 6.86, 8.43, 8.43, 2.86, 2.14, 2.43, 4.86, 12.86, 8.71, 5, 5.71, 10.57, 29.29, 6.43, 9.86,
  19.29, 31.57, 13, 16, 13, 16, 13, 16, 13, 16, 13, 16, 13, 16, 13, 16, 13, 16, 12.14, 16, 31.29, 20,
  24.86, 19.29, 32.71, 25.14, 13.57, 30.86, 16.14, 50.14, 46, 28.14, 31.71, 14, 15.86, 15.57, 15.71,
  16.71, 49.86, 23.43, 32.43, 25.14, 37, 14.57, 27, 59.57, 27, 23.71, 23.71, 23.71, 21.43, 33.57,
  35.14, 27.43, 17.71, 35, 21.86, 28.71, 24.57, 25.14, 51.57, 32.71, 34.86, 53.29, 61.57, 23.43,
  27.43, 36.71, 14.29, 19.14, 16.86, 17.29, 17.57, 16.71, 27.57, 15.43, 67.29, 57.57, 27.14, 22.14,
  31.86, 36.43, 20.86, 36.14, 36.43,
]

/** bu.xlsx mergeCells — row 1 question-number groups */
export const ANKET_CEVAPLARI_EXCEL_MERGES: XLSX.Range[] = [
  { s: { r: 0, c: 14 }, e: { r: 0, c: 16 } },
  { s: { r: 0, c: 37 }, e: { r: 0, c: 43 } },
  { s: { r: 0, c: 44 }, e: { r: 0, c: 47 } },
  { s: { r: 0, c: 51 }, e: { r: 0, c: 53 } },
  { s: { r: 0, c: 55 }, e: { r: 0, c: 56 } },
  { s: { r: 0, c: 60 }, e: { r: 0, c: 61 } },
  { s: { r: 0, c: 62 }, e: { r: 0, c: 75 } },
  { s: { r: 0, c: 88 }, e: { r: 0, c: 89 } },
  { s: { r: 0, c: 99 }, e: { r: 0, c: 100 } },
]

export const LIVING_CONDITION_OPTION_ORDER = [
  'İçme Suyu',
  'Elektrik',
  'Tuvalet',
  'Temizlik (Hijyen) Suyu',
] as const
