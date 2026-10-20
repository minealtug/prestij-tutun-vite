import { describe, expect, it } from 'vitest'
import {
  computeEkiciSurveyCoverage,
  computeMintikaEkiciFillRows,
} from './compute-ekici-survey-coverage'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
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

    const coverage = computeEkiciSurveyCoverage(ekiciIds, surveys)
    expect(coverage).toEqual({
      totalEkiciCount: 4,
      completedEkiciCount: 2,
      partialEkiciCount: 1,
      untouchedEkiciCount: 1,
      completedPercent: 50,
      partialPercent: 25,
      untouchedPercent: 25,
    })
    expect(
      coverage.completedEkiciCount + coverage.partialEkiciCount + coverage.untouchedEkiciCount,
    ).toBe(coverage.totalEkiciCount)
  })

  it('counts mixed surveys as partial so statuses stay exclusive', () => {
    const ekiciIds = ['e1']
    const surveys = [
      makeSurvey('e1', 10, 0, 's1'),
      makeSurvey('e1', 2, 8, 's2'),
    ]

    expect(computeEkiciSurveyCoverage(ekiciIds, surveys)).toEqual({
      totalEkiciCount: 1,
      completedEkiciCount: 0,
      partialEkiciCount: 1,
      untouchedEkiciCount: 0,
      completedPercent: 0,
      partialPercent: 100,
      untouchedPercent: 0,
    })
  })
})

function makeEkici(
  overrides: Partial<EkiciDefinitionDto> & Pick<EkiciDefinitionDto, 'id' | 'mintikaAdi'>,
): EkiciDefinitionDto {
  return {
    yil: 2026,
    tcKimlikNo: '',
    menseiId: 1,
    bolgeId: 1,
    mintikaId: 1,
    alimNoktasiId: 1,
    koyId: 1,
    menseiAdi: null,
    bolgeAdi: null,
    alimNoktasiAdi: null,
    koyAdi: null,
    ozKontNo: 0,
    ad: 'Ali',
    soyad: 'Yılmaz',
    babaAdi: '',
    anaAdi: null,
    dogumYeri: null,
    dogumTarihi: '',
    cinsiyet: null,
    icralik: false,
    ekiciDurumId: 1,
    ekiciDurumAdi: null,
    aktif: 1,
    makineKodu: '',
    uretimMerkeziId: 0,
    temlik: null,
    sozlesmeIptal: null,
    kaynak: 'AppDb',
    ...overrides,
  }
}

describe('computeMintikaEkiciFillRows', () => {
  it('groups ekici and survey counts by mintika', () => {
    const rows = computeMintikaEkiciFillRows(
      [
        makeEkici({ id: 'e1', mintikaAdi: 'TAVAS' }),
        makeEkici({ id: 'e2', mintikaAdi: 'TAVAS' }),
        makeEkici({ id: 'e3', mintikaAdi: 'KARACASU' }),
        makeEkici({ id: 'e4', mintikaAdi: 'KARACASU' }),
      ],
      [
        makeSurvey('e1', 10, 0, 's1'),
        makeSurvey('e1', 2, 8, 's2'),
        makeSurvey('e3', 5, 0, 's3'),
      ],
    )

    expect(rows).toEqual([
      {
        key: 'karacasu',
        label: 'KARACASU',
        totalEkici: 2,
        completedEkici: 1,
        partialEkici: 0,
        untouchedEkici: 1,
      },
      {
        key: 'tavas',
        label: 'TAVAS',
        totalEkici: 2,
        completedEkici: 0,
        partialEkici: 1,
        untouchedEkici: 1,
      },
    ])
  })
})
