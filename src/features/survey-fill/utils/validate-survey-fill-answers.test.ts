import { describe, expect, it } from 'vitest'
import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import {
  listUnansweredOptionalQuestions,
  validateSurveyFillAnswer,
} from './validate-survey-fill-answers'

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

describe('listUnansweredOptionalQuestions', () => {
  it('lists empty optional questions and skips required ones', () => {
    const optionalEmpty = question({
      soruId: 2,
      soruMetni: 'Not?',
      cevapGirdiTipAdi: 'Kısa Metin',
    })
    const optionalFilled = question({
      soruId: 3,
      soruMetni: 'Açıklama?',
      cevapGirdiTipAdi: 'Kısa Metin',
    })
    const requiredEmpty = question({
      soruId: 4,
      soruMetni: 'Ad?',
      zorunlu: true,
      cevapGirdiTipAdi: 'Kısa Metin',
    })

    expect(
      listUnansweredOptionalQuestions(
        [optionalEmpty, optionalFilled, requiredEmpty],
        { 'yanit-3': 'yazıldı' },
      ),
    ).toEqual([{ key: 'yanit-2', label: 'Not?' }])
  })
}
