import { describe, expect, it } from 'vitest'
import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import { validateSurveyFillAnswer } from './validate-survey-fill-answers'

function question(overrides: Partial<SurveyFillSoruView> = {}): SurveyFillSoruView {
  return {
    soruId: 1,
    soruMetni: 'Ailede bakmakla yükümlü olunan birey sayısı?',
    zorunlu: false,
    cevapGirdiTipAdi: 'Sayı',
    ...overrides,
  }
}

describe('validateSurveyFillAnswer bakmakla yükümlü sayısı', () => {
  it('rejects empty, zero and negative values', () => {
    expect(validateSurveyFillAnswer(question(), '')).toBe(
      'Bakmakla yükümlü olunan birey sayısı en az 1 olmalıdır.',
    )
    expect(validateSurveyFillAnswer(question(), '0')).toBe(
      'Bakmakla yükümlü olunan birey sayısı en az 1 olmalıdır.',
    )
    expect(validateSurveyFillAnswer(question(), '-1')).toBe(
      'Bakmakla yükümlü olunan birey sayısı en az 1 olmalıdır.',
    )
  })

  it('accepts 1 or more', () => {
    expect(validateSurveyFillAnswer(question(), '1')).toBeUndefined()
    expect(validateSurveyFillAnswer(question(), '3')).toBeUndefined()
  })

  it('still requires at least 1 when the field is not typed as number', () => {
    expect(
      validateSurveyFillAnswer(question({ cevapGirdiTipAdi: 'Metin' }), '0'),
    ).toBe('Bakmakla yükümlü olunan birey sayısı en az 1 olmalıdır.')
  })
})
