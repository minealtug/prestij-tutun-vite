import { describe, expect, it } from 'vitest'
import { countGeziEkiciler } from './count-gezi-ekiciler'

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
