import { describe, expect, it } from 'vitest'
import { getVisibleMintikaFillSeries } from './AdminMintikaFillBarChart'

describe('getVisibleMintikaFillSeries', () => {
  it('returns all series when nothing is focused', () => {
    expect(getVisibleMintikaFillSeries(null).map((series) => series.key)).toEqual([
      'totalEkici',
      'completedSurveys',
      'partialSurveys',
      'untouchedEkici',
    ])
  })

  it('keeps only the focused status bars', () => {
    expect(getVisibleMintikaFillSeries('completedSurveys').map((series) => series.key)).toEqual([
      'completedSurveys',
    ])
    expect(getVisibleMintikaFillSeries('partialSurveys').map((series) => series.key)).toEqual([
      'partialSurveys',
    ])
    expect(getVisibleMintikaFillSeries('untouchedEkici').map((series) => series.key)).toEqual([
      'untouchedEkici',
    ])
    expect(getVisibleMintikaFillSeries('totalEkici').map((series) => series.key)).toEqual([
      'totalEkici',
    ])
  })
})
