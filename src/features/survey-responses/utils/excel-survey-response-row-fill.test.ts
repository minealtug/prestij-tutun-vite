import { describe, expect, it } from 'vitest'
import { getSurveyResponseExcelFillRgb, SURVEY_RESPONSE_EXCEL_FILL } from './excel-survey-response-row-fill'
import type { AnketCevapOzetItem } from '../types/survey-response.types'

function makeRow(yanitlanan: number, yanitlanmayan: number): AnketCevapOzetItem {
  return {
    id: '1',
    ekiciId: 'e1',
    sablonId: 1,
    ekiciAd: 'Test',
    ekiciSoyad: 'Ekici',
    mintikaAdi: 'AKHİSAR',
    baslikAdi: 'STP ANKETİ',
    sablonAdi: 'STP ANKETİ',
    sonIslemTarihi: '2026-07-01T10:00:00.000Z',
    yanitlananSoruSayisi: yanitlanan,
    yanitlanmayanSoruSayisi: yanitlanmayan,
  }
}

describe('getSurveyResponseExcelFillRgb', () => {
  it('returns green fill for completed rows', () => {
    expect(getSurveyResponseExcelFillRgb(makeRow(10, 0))).toBe(
      SURVEY_RESPONSE_EXCEL_FILL.completed,
    )
  })

  it('returns yellow fill for partial rows', () => {
    expect(getSurveyResponseExcelFillRgb(makeRow(4, 6))).toBe(
      SURVEY_RESPONSE_EXCEL_FILL.inProgress,
    )
  })

  it('returns undefined for untouched rows', () => {
    expect(getSurveyResponseExcelFillRgb(makeRow(0, 0))).toBeUndefined()
  })
})
