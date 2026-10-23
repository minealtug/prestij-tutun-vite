import { describe, expect, it } from 'vitest'
import { matchesAnketCevapYil, matchesEkiciAdSoyadSearch } from './filter-anket-cevap-list'

describe('matchesEkiciAdSoyadSearch', () => {
  const ali = { ekiciAd: 'Ali', ekiciSoyad: 'Yılmaz' }
  const ayse = { ekiciAd: 'Ayşe', ekiciSoyad: 'Demir' }

  it('matches the combined first and last name', () => {
    expect(matchesEkiciAdSoyadSearch(ali, 'Ali Yılmaz')).toBe(true)
    expect(matchesEkiciAdSoyadSearch(ali, 'ali yılmaz')).toBe(true)
  })

  it('matches a part of the combined name', () => {
    expect(matchesEkiciAdSoyadSearch(ali, 'yılmaz')).toBe(true)
    expect(matchesEkiciAdSoyadSearch(ali, 'Al')).toBe(true)
    expect(matchesEkiciAdSoyadSearch(ayse, 'Ayşe Demir')).toBe(true)
  })

  it('ignores extra spaces and Turkish casing', () => {
    expect(matchesEkiciAdSoyadSearch({ ekiciAd: 'İSMAİL', ekiciSoyad: 'ÖZTÜRK' }, 'ismail öztürk')).toBe(
      true,
    )
    expect(matchesEkiciAdSoyadSearch(ali, '  ali    yılmaz  ')).toBe(true)
  })

  it('rejects a different name and keeps every row when the query is empty', () => {
    expect(matchesEkiciAdSoyadSearch(ali, 'Ayşe')).toBe(false)
    expect(matchesEkiciAdSoyadSearch(ali, '   ')).toBe(true)
  })
})

describe('matchesAnketCevapYil', () => {
  const years = new Map<string, number>([['ekici-1', 2026]])

  it('keeps every row when no year is selected', () => {
    expect(matchesAnketCevapYil('ekici-1', years, 'all')).toBe(true)
    expect(matchesAnketCevapYil('ekici-2', years, '')).toBe(true)
  })

  it('matches the ekici year without regard to id casing', () => {
    expect(matchesAnketCevapYil('EKICI-1', years, '2026')).toBe(true)
    expect(matchesAnketCevapYil('ekici-1', years, '2025')).toBe(false)
    expect(matchesAnketCevapYil('ekici-2', years, '2026')).toBe(false)
  })
})
