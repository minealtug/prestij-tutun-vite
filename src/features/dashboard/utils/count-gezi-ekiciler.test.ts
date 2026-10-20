import { describe, expect, it } from 'vitest'
import { countGeziEkiciler, parseCountNumber } from './count-gezi-ekiciler'

describe('countGeziEkiciler', () => {
  it('counts unique ekici ids from a gezi list', () => {
    expect(
      countGeziEkiciler([
        { id: 1, ekiciId: 'a' },
        { id: 2, ekiciId: 'a' },
        { Id: 3, EkiciId: 'b' },
      ]),
    ).toBe(2)
  })

  it('falls back to row id when ekici id is missing', () => {
    expect(countGeziEkiciler([{ id: '10' }, { id: '11' }])).toBe(2)
  })

  it('reads a wrapped list', () => {
    expect(countGeziEkiciler({ data: [{ ekiciId: 'a' }] })).toBe(1)
  })
})

describe('parseCountNumber', () => {
  it('reads a raw number', () => {
    expect(parseCountNumber(42)).toBe(42)
  })

  it('reads common wrapped count fields', () => {
    expect(parseCountNumber({ sayi: 12 })).toBe(12)
    expect(parseCountNumber({ tutunuOlanUreticiSayisi: 8 })).toBe(8)
    expect(parseCountNumber({ data: 3 })).toBe(3)
  })
})
