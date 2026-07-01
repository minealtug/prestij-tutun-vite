import { describe, expect, it } from 'vitest'
import { resolveSurveyMintikaAdi } from './enrich-survey-location'

describe('resolveSurveyMintikaAdi', () => {
  const ekiciById = new Map([
    [
      'ekici-1',
      {
        mintikaId: 8,
        mintikaAdi: 'AKHİSAR',
        bolgeAdi: 'EGE',
        menseiAdi: 'TÜRKİYE',
      },
    ],
    [
      'ekici-2',
      {
        mintikaId: 6,
        mintikaAdi: 'KALE',
        bolgeAdi: 'EGE',
        menseiAdi: 'TÜRKİYE',
      },
    ],
  ])

  const mintikaById = new Map([
    [6, 'KALE'],
    [7, 'TORBALI'],
    [8, 'AKHİSAR'],
  ])

  it('prefers ekici mintika over survey summary mintika', () => {
    expect(
      resolveSurveyMintikaAdi(
        { ekiciId: 'ekici-2', mintikaId: 8, mintikaAdi: 'AKHİSAR' },
        ekiciById,
        mintikaById,
      ),
    ).toBe('KALE')
  })

  it('falls back to mintikaId lookup when ekici is missing', () => {
    expect(
      resolveSurveyMintikaAdi(
        { ekiciId: 'missing', mintikaId: 7, mintikaAdi: 'AKHİSAR' },
        ekiciById,
        mintikaById,
      ),
    ).toBe('TORBALI')
  })

  it('falls back to survey mintikaAdi when no lookup exists', () => {
    expect(
      resolveSurveyMintikaAdi(
        { ekiciId: 'missing', mintikaAdi: 'MANİSA' },
        ekiciById,
        mintikaById,
      ),
    ).toBe('MANİSA')
  })
})
