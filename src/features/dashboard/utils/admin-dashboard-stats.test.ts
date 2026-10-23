import { describe, expect, it } from 'vitest'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import {
  computeAdminFieldFillSummary,
  computeAdminEkiciActivity,
  filterSurveysByCografi,
  startOfLocalWeek,
} from './admin-dashboard-stats'

function makeSurvey(
  overrides: Partial<AnketCevapOzetItem> & Pick<AnketCevapOzetItem, 'id'>,
): AnketCevapOzetItem {
  return {
    ekiciId: 'e1',
    sablonId: 1,
    ekiciAd: 'Ali',
    ekiciSoyad: 'Veli',
    mintikaAdi: 'Mıntıka A',
    bolgeAdi: 'Bölge 1',
    baslikAdi: 'Anket',
    sablonAdi: 'Şablon',
    sonIslemTarihi: new Date().toISOString(),
    yanitlananSoruSayisi: 5,
    yanitlanmayanSoruSayisi: 0,
    ...overrides,
  }
}

function makeEkici(
  overrides: Partial<EkiciDefinitionDto> & Pick<EkiciDefinitionDto, 'id'>,
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
    mintikaAdi: 'Mıntıka A',
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

describe('admin-dashboard-stats', () => {
  it('computes today/week field fill summary', () => {
    const now = new Date(2026, 6, 21, 15, 0, 0) // Tuesday
    const todayIso = new Date(2026, 6, 21, 10, 0, 0).toISOString()
    const mondayIso = new Date(2026, 6, 20, 10, 0, 0).toISOString()
    const lastWeekIso = new Date(2026, 6, 13, 10, 0, 0).toISOString()

    const summary = computeAdminFieldFillSummary(
      [
        makeSurvey({
          id: '1',
          sonIslemTarihi: todayIso,
          yanitlananSoruSayisi: 3,
          yanitlanmayanSoruSayisi: 0,
        }),
        makeSurvey({
          id: '2',
          sonIslemTarihi: todayIso,
          yanitlananSoruSayisi: 2,
          yanitlanmayanSoruSayisi: 1,
        }),
        makeSurvey({
          id: '3',
          sonIslemTarihi: mondayIso,
          yanitlananSoruSayisi: 4,
          yanitlanmayanSoruSayisi: 0,
        }),
        makeSurvey({
          id: '4',
          sonIslemTarihi: lastWeekIso,
          yanitlananSoruSayisi: 1,
          yanitlanmayanSoruSayisi: 2,
        }),
      ],
      now,
    )

    expect(summary.completed).toBe(2)
    expect(summary.partial).toBe(2)
    expect(summary.today.completed).toBe(1)
    expect(summary.today.partial).toBe(1)
    expect(summary.week.completed).toBe(2)
    expect(summary.week.partial).toBe(1)
    expect(startOfLocalWeek(now)).toBe(new Date(2026, 6, 20).getTime())
  })

  it('computes ekici activity and never-filled ekiciler', () => {
    const ekiciler = [
      makeEkici({ id: 'e1', ad: 'Ali', soyad: 'Yılmaz' }),
      makeEkici({ id: 'e2', ad: 'Veli', soyad: 'Demir', aktif: 0 }),
      makeEkici({ id: 'e3', ad: 'Ayşe', soyad: 'Kaya' }),
    ]

    const activity = computeAdminEkiciActivity(ekiciler, [
      makeSurvey({
        id: '1',
        ekiciId: 'e1',
        sonIslemTarihi: new Date(2026, 6, 20).toISOString(),
      }),
      makeSurvey({
        id: '2',
        ekiciId: 'e3',
        sonIslemTarihi: new Date(2025, 0, 1).toISOString(),
      }),
    ])

    expect(activity.activeEkiciler).toBe(2)
    expect(activity.filledEkiciler).toBe(2)
    expect(activity.neverFilled).toBe(1)
  })

  it('keeps a survey whose mintika matches even if the ekici mensei id does not', () => {
    const ekiciler = new Map([
      [
        'E1',
        makeEkici({
          id: 'E1',
          menseiId: 99,
          bolgeId: 99,
          mintikaId: 7,
        }),
      ],
    ])
    const survey = makeSurvey({
      id: 'stale-1',
      ekiciId: 'e1',
      mintikaId: 7,
      yanitlananSoruSayisi: 2,
      yanitlanmayanSoruSayisi: 3,
    })

    const filtered = filterSurveysByCografi(
      [survey],
      ekiciler,
      { menseiId: 1, bolgeId: 2, mintikaId: 7 },
      [7],
    )

    expect(filtered.map((item) => item.id)).toEqual(['stale-1'])
  })

  it('drops a survey outside the selected mintika', () => {
    const ekiciler = new Map([
      ['e1', makeEkici({ id: 'e1', menseiId: 1, bolgeId: 2, mintikaId: 8 })],
    ])
    const survey = makeSurvey({ id: 'other', ekiciId: 'e1', mintikaId: 8 })

    expect(
      filterSurveysByCografi([survey], ekiciler, { menseiId: 1, bolgeId: 2, mintikaId: 7 }, [7]),
    ).toEqual([])
  })
})
