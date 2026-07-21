import { describe, expect, it } from 'vitest'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import type { UserDto } from '@/features/users/types/user.types'
import {
  computeAdminFieldFillSummary,
  computeAdminUserActivity,
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

function makeUser(overrides: Partial<UserDto> & Pick<UserDto, 'id' | 'userName'>): UserDto {
  return {
    fullName: 'Test User',
    userTypeId: 1,
    userTypeDescription: null,
    admin: false,
    aktif: true,
    lokasyon: null,
    departmanId: null,
    departmanAdi: null,
    mintikaId: null,
    mintikaAdi: null,
    supervisorUserId: null,
    insuranceNumber: null,
    icraOdemeUyari: false,
    uretimMerkeziYetki: false,
    email: null,
    tel: null,
    fotografUrl: null,
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

  it('computes user activity and never-filled users', () => {
    const now = new Date(2026, 6, 21)
    const users = [
      makeUser({ id: 1, userName: 'ali', fullName: 'Ali' }),
      makeUser({ id: 2, userName: 'veli', fullName: 'Veli', aktif: false }),
      makeUser({ id: 3, userName: 'ayse', fullName: 'Ayşe' }),
    ]

    const activity = computeAdminUserActivity(
      users,
      [
        makeSurvey({
          id: '1',
          kullaniciAdi: 'ali',
          sonIslemTarihi: new Date(2026, 6, 20).toISOString(),
        }),
      ],
      7,
      now,
    )

    expect(activity.activeUsers).toBe(2)
    expect(activity.passiveUsers).toBe(1)
    expect(activity.filledInWindow).toBe(1)
    expect(activity.neverFilled).toBe(2)
    expect(activity.neverFilledUsers.map((u) => u.userName)).toEqual(['ayse', 'veli'])
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
