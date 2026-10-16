import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '@/features/questions/types/question.types'
import type { AnketYanitSoruDto } from '../types/anket-yanit.types'
import { enrichOturumQuestionsWithDefinitions } from './enrich-oturum-questions'

function oturumSoru(partial: Partial<AnketYanitSoruDto> & Pick<AnketYanitSoruDto, 'soruId'>): AnketYanitSoruDto {
  return {
    sira: 1,
    soruMetni: 'açıklayınız',
    altSoruMetni: null,
    gorunur: true,
    zorunlu: false,
    bagliSoru: true,
    bagliOlduguSoruId: 10,
    bagliAltSecenekId: 101,
    cevapGirdiTipAdi: 'Metin',
    cevapGirdiTipId: 1,
    secenekGrupId: null,
    altSecenekler: [],
    yanitlandi: false,
    cevapText: null,
    cevapAltSecenekId: null,
    cevapAltSecenekIds: [],
    ekiciId: null,
    ...partial,
  }
}

function definition(partial: Partial<QuestionDto> & Pick<QuestionDto, 'id'>): QuestionDto {
  return {
    baslikId: 1,
    baslikAdi: 'Anket',
    soruMetni: 'açıklayınız',
    altSoruMetni: null,
    zorunlu: false,
    aktif: true,
    secenekGrupId: null,
    bagliSoru: true,
    bagliOlduguSoruId: 10,
    ...partial,
  }
}

describe('enrichOturumQuestionsWithDefinitions bagliKosullar', () => {
  it('keeps oturum bagliKosullar and does not let the singular parent field replace them', () => {
    const enriched = enrichOturumQuestionsWithDefinitions(
      [
        oturumSoru({
          soruId: 30,
          bagliOlduguSoruId: 10,
          bagliKosullar: [
            { parentSoruId: 10, bagliAltSecenekId: 101, bagliKosulTipi: 'esit' },
            { parentSoruId: 20, bagliAltSecenekId: 201, bagliKosulTipi: 'esit' },
          ],
        }),
      ],
      [
        definition({
          id: 30,
          bagliOlduguSoruId: 10,
          bagliKosullar: [{ parentSoruId: 10, bagliAltSecenekId: 101, bagliKosulTipi: 'esit' }],
        }),
      ],
    )

    expect(enriched[0]?.bagliKosullar).toEqual([
      { parentSoruId: 10, bagliAltSecenekId: 101, bagliKosulTipi: 'esit' },
      { parentSoruId: 20, bagliAltSecenekId: 201, bagliKosulTipi: 'esit' },
    ])
  })

  it('fills bagliKosullar from the definition when the oturum list is empty', () => {
    const fromDefinition = [
      { parentSoruId: 10, bagliAltSecenekId: 101, bagliKosulTipi: 'esit' },
      { parentSoruId: 20, bagliAltSecenekId: 201, bagliKosulTipi: 'esit' },
    ]
    const enriched = enrichOturumQuestionsWithDefinitions(
      [oturumSoru({ soruId: 30, bagliKosullar: [] })],
      [definition({ id: 30, bagliKosullar: fromDefinition })],
    )

    expect(enriched[0]?.bagliKosullar).toEqual(fromDefinition)
  })
})
