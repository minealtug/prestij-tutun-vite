import { describe, expect, it } from 'vitest'
import { computeEkiciSurveyCoverage } from './compute-ekici-survey-coverage'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'

function makeSurvey(
  ekiciId: string,
  yanitlanan: number,
  yanitlanmayan: number,
  id: string,
): AnketCevapOzetItem {
  return {
    id,
    ekiciId,
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

describe('computeEkiciSurveyCoverage', () => {
  it('calculates completed and partial ratios against all ekiciler', () => {
    const ekiciIds = ['e1', 'e2', 'e3', 'e4']
    const surveys = [
      makeSurvey('e1', 10, 0, 's1'),
      makeSurvey('e2', 4, 6, 's2'),
      makeSurvey('e3', 8, 0, 's3'),
    ]

    expect(computeEkiciSurveyCoverage(ekiciIds, surveys)).toEqual({
      totalEkiciCount: 4,
      completedEkiciCount: 2,
      partialEkiciCount: 1,
      untouchedEkiciCount: 1,
      completedPercent: 50,
      partialPercent: 25,
      untouchedPercent: 25,
    })
  })

  it('counts ekici as both completed and partial when they have mixed surveys', () => {
    const ekiciIds = ['e1']
    const surveys = [
      makeSurvey('e1', 10, 0, 's1'),
      makeSurvey('e1', 2, 8, 's2'),
    ]

    expect(computeEkiciSurveyCoverage(ekiciIds, surveys)).toEqual({
      totalEkiciCount: 1,
      completedEkiciCount: 1,
      partialEkiciCount: 1,
      untouchedEkiciCount: 0,
      completedPercent: 100,
      partialPercent: 100,
      untouchedPercent: 0,
    })
  })
})
