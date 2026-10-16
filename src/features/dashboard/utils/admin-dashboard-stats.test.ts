import { describe, expect, it } from 'vitest'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import {
  computeAdminFieldFillSummary,
  computeAdminEkiciActivity,
  computeMintikaComparison,
  countStalePartials,
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

  it('ranks mintika comparison by completion percent', () => {
    const rows = computeMintikaComparison([
      makeSurvey({
        id: '1',
        mintikaAdi: 'Yüksek',
        yanitlananSoruSayisi: 5,
        yanitlanmayanSoruSayisi: 0,
      }),
      makeSurvey({
        id: '2',
        mintikaAdi: 'Yüksek',
        yanitlananSoruSayisi: 5,
        yanitlanmayanSoruSayisi: 0,
      }),
      makeSurvey({
        id: '3',
        mintikaAdi: 'Düşük',
        yanitlananSoruSayisi: 1,
        yanitlanmayanSoruSayisi: 4,
      }),
      makeSurvey({
        id: '4',
        mintikaAdi: 'Düşük',
        yanitlananSoruSayisi: 1,
        yanitlanmayanSoruSayisi: 4,
      }),
    ])

    expect(rows[0]?.label).toBe('Yüksek')
    expect(rows[0]?.completionPercent).toBe(100)
    expect(rows[1]?.label).toBe('Düşük')
    expect(rows[1]?.completionPercent).toBe(0)
  })

  it('groups ekiciler under mintika comparison rows', () => {
    const rows = computeMintikaComparison([
      makeSurvey({
        id: '1',
        ekiciId: 'e1',
        ekiciAd: 'Ali',
        ekiciSoyad: 'Yılmaz',
        mintikaAdi: 'TAVAS',
        yanitlananSoruSayisi: 5,
        yanitlanmayanSoruSayisi: 0,
      }),
      makeSurvey({
        id: '2',
        ekiciId: 'e1',
        ekiciAd: 'Ali',
        ekiciSoyad: 'Yılmaz',
        mintikaAdi: 'TAVAS',
        sablonId: 2,
        yanitlananSoruSayisi: 1,
        yanitlanmayanSoruSayisi: 4,
      }),
      makeSurvey({
        id: '3',
        ekiciId: 'e2',
        ekiciAd: 'Ayşe',
        ekiciSoyad: 'Demir',
        mintikaAdi: 'TAVAS',
        yanitlananSoruSayisi: 1,
        yanitlanmayanSoruSayisi: 3,
      }),
      makeSurvey({
        id: '4',
        ekiciId: 'e3',
        ekiciAd: 'Mehmet',
        ekiciSoyad: 'Kaya',
        mintikaAdi: 'KARACASU',
        yanitlananSoruSayisi: 2,
        yanitlanmayanSoruSayisi: 2,
      }),
    ])

    const tavas = rows.find((row) => row.label === 'TAVAS')
    expect(tavas?.total).toBe(3)
    expect(tavas?.children).toHaveLength(2)
    expect(tavas?.children?.map((child) => child.label)).toEqual(['Ali Yılmaz', 'Ayşe Demir'])
    expect(tavas?.children?.[0]).toMatchObject({
      completed: 1,
      partial: 1,
      total: 2,
      completionPercent: 50,
    })
    expect(tavas?.children?.[1]).toMatchObject({
      completed: 0,
      partial: 1,
      total: 1,
      completionPercent: 0,
    })
  })

  it('computes ekici activity and never-filled ekiciler', () => {
    const now = new Date(2026, 6, 21)
    const ekiciler = [
      makeEkici({ id: 'e1', ad: 'Ali', soyad: 'Yılmaz' }),
      makeEkici({ id: 'e2', ad: 'Veli', soyad: 'Demir', aktif: 0 }),
      makeEkici({ id: 'e3', ad: 'Ayşe', soyad: 'Kaya' }),
    ]

    const activity = computeAdminEkiciActivity(
      ekiciler,
      [
        makeSurvey({
          id: '1',
          ekiciId: 'e1',
          sonIslemTarihi: new Date(2026, 6, 20).toISOString(),
        }),
      ],
      7,
      now,
    )

    expect(activity.activeEkiciler).toBe(2)
    expect(activity.passiveEkiciler).toBe(1)
    expect(activity.filledInWindow).toBe(1)
    expect(activity.neverFilled).toBe(2)
  })

  it('counts stale partials older than 7 days', () => {
    const staleIso = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const freshIso = new Date().toISOString()

    expect(
      countStalePartials([
        makeSurvey({
          id: '1',
          sonIslemTarihi: staleIso,
          yanitlananSoruSayisi: 1,
          yanitlanmayanSoruSayisi: 2,
        }),
        makeSurvey({
          id: '2',
          sonIslemTarihi: freshIso,
          yanitlananSoruSayisi: 1,
          yanitlanmayanSoruSayisi: 2,
        }),
      ]),
    ).toBe(1)
  })
})
