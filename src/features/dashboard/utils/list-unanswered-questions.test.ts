import { describe, expect, it } from 'vitest'
import type { AnketCevapDetayDto } from '@/features/survey-responses/types/survey-response.types'
import { listUnansweredQuestionTexts } from './list-unanswered-questions'

function makeDetail(sorular: AnketCevapDetayDto['sorular']): AnketCevapDetayDto {
  return {
    sorular,
    yanitlanmayanSoruSayisi: sorular.filter((soru) => !soru.yanitlandi).length,
  }
}

describe('listUnansweredQuestionTexts', () => {
  it('returns unanswered question texts in sira order', () => {
    const texts = listUnansweredQuestionTexts(
      makeDetail([
        {
          sira: 3,
          soruId: 3,
          soruMetni: 'Doğum tarihi?',
          yanitlandi: false,
        },
        {
          sira: 1,
          soruId: 1,
          soruMetni: 'Üretimi yapan?',
          yanitlandi: true,
        },
        {
          sira: 2,
          soruId: 2,
          soruMetni: 'Cinsiyet?',
          yanitlandi: false,
        },
      ]),
    )

    expect(texts).toEqual(['Cinsiyet?', 'Doğum tarihi?'])
  })
})
