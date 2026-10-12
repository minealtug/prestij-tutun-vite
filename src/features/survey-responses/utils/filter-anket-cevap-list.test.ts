import { describe, expect, it } from 'vitest'
import { matchesEkiciAdSoyadSearch } from './filter-anket-cevap-list'

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
