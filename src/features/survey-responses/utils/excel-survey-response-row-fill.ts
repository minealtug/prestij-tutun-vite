import * as XLSX from 'xlsx-js-style'
import type { AnketCevapOzetItem } from '../types/survey-response.types'
import { getSurveyResponseRowClassName } from './map-anket-cevap'

/** Tailwind green-50 / yellow-50 karşılıkları */
export const SURVEY_RESPONSE_EXCEL_FILL = {
  completed: 'F0FDF4',
  inProgress: 'FEFCE8',
} as const

export function getSurveyResponseExcelFillRgb(
  item: Pick<AnketCevapOzetItem, 'yanitlananSoruSayisi' | 'yanitlanmayanSoruSayisi'>,
): string | undefined {
  const className = getSurveyResponseRowClassName(item)
  if (className === 'app-table-row--completed') return SURVEY_RESPONSE_EXCEL_FILL.completed
  if (className === 'app-table-row--in-progress') return SURVEY_RESPONSE_EXCEL_FILL.inProgress
  return undefined
}

export function applySurveyResponseRowFills(
  worksheet: XLSX.WorkSheet,
  rowFillRgb: Array<string | undefined>,
): void {
  const ref = worksheet['!ref']
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)

  rowFillRgb.forEach((fillRgb, index) => {
    if (!fillRgb) return

    const rowIndex = range.s.r + 1 + index

    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: col })
      const cell = worksheet[address]
      if (!cell) continue

      cell.s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: fillRgb },
        },
      }
    }
  })
}
