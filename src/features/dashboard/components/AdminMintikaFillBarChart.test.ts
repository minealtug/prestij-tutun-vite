import { describe, expect, it } from 'vitest'
import { getVisibleMintikaFillSeries } from './AdminMintikaFillBarChart'

describe('getVisibleMintikaFillSeries', () => {
  it('returns all series when nothing is focused', () => {
    expect(getVisibleMintikaFillSeries(null).map((series) => series.key)).toEqual([
      'totalEkici',
      'completedEkici',
      'partialEkici',
      'untouchedEkici',
    ])
  })

  it('keeps only the focused status bars', () => {
    expect(getVisibleMintikaFillSeries('completedEkici').map((series) => series.key)).toEqual([
      'completedEkici',
    ])
    expect(getVisibleMintikaFillSeries('partialEkici').map((series) => series.key)).toEqual([
      'partialEkici',
    ])
    expect(getVisibleMintikaFillSeries('untouchedEkici').map((series) => series.key)).toEqual([
      'untouchedEkici',
    ])
    expect(getVisibleMintikaFillSeries('totalEkici').map((series) => series.key)).toEqual([
      'totalEkici',
    ])
  })
})
