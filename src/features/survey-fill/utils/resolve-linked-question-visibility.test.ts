import { describe, expect, it } from 'vitest'
import type { AnketYanitSoruDto } from '../types/anket-yanit.types'
import { getQuestionKey } from './question-key'
import { filterVisibleQuestionsForFill } from './resolve-linked-question-visibility'

function soru(
  partial: Partial<AnketYanitSoruDto> & Pick<AnketYanitSoruDto, 'soruId' | 'soruMetni'>,
): AnketYanitSoruDto {
  return {
    sira: 0,
    siraNo: partial.soruId,
    altSoruMetni: null,
    gorunur: true,
    zorunlu: false,
    bagliSoru: false,
    cevapGirdiTipAdi: 'Seçenek',
    cevapGirdiTipId: 1,
    secenekGrupId: 1,
    altSecenekler: [],
    yanitlandi: false,
    cevapText: null,
    cevapAltSecenekId: null,
    cevapAltSecenekIds: [],
    ekiciId: null,
    ...partial,
  }
}

const ANLASMA_DIGER = 101
const ANLASMA_DIGER_DEGIL = 102
const ZIRAAT_DIGER = 201
const ZIRAAT_DIGER_DEGIL = 202

function sampleQuestions(): AnketYanitSoruDto[] {
  return [
    soru({
      soruId: 10,
      soruMetni: 'Anlaşma Şekli (Genel Durum)',
      siraNo: 1,
      altSecenekler: [
        { id: ANLASMA_DIGER, adi: 'Diğer' },
        { id: ANLASMA_DIGER_DEGIL, adi: 'Sözleşme' },
      ],
    }),
    soru({
      soruId: 20,
      soruMetni: 'Yapılan ziraat türü?',
      siraNo: 2,
      altSecenekler: [
        { id: ZIRAAT_DIGER, adi: 'Diğer' },
        { id: ZIRAAT_DIGER_DEGIL, adi: 'Tütün' },
      ],
    }),
    soru({
      soruId: 30,
      soruMetni: 'kullanılacak soru - açıklayınız',
      siraNo: 3,
      bagliSoru: true,
      bagliOlduguSoruId: 10,
      bagliAltSecenekId: ANLASMA_DIGER,
      bagliKosulTipi: 'esit',
      secenekGrupId: null,
      cevapGirdiTipAdi: 'Metin',
      bagliKosullar: [
        { parentSoruId: 10, bagliAltSecenekId: ANLASMA_DIGER, bagliKosulTipi: 'esit' },
        { parentSoruId: 20, bagliAltSecenekId: ZIRAAT_DIGER, bagliKosulTipi: 'esit' },
      ],
    }),
  ]
}

describe('filterVisibleQuestionsForFill bagliKosullar', () => {
  it('shows the child under the second parent when only that condition matches', () => {
    const questions = sampleQuestions()
    const visible = filterVisibleQuestionsForFill(questions, {
      [getQuestionKey(questions[1]!)]: String(ZIRAAT_DIGER),
    })

    expect(visible.map((item) => item.soruId)).toEqual([10, 20, 30])
    expect(visible.filter((item) => item.soruId === 30)).toHaveLength(1)
  })

  it('shows the child under the first parent when only that condition matches', () => {
    const questions = sampleQuestions()
    const visible = filterVisibleQuestionsForFill(questions, {
      [getQuestionKey(questions[0]!)]: String(ANLASMA_DIGER),
    })

    expect(visible.map((item) => item.soruId)).toEqual([10, 30, 20])
  })

  it('hides the child when neither parent condition matches', () => {
    const questions = sampleQuestions()
    const visible = filterVisibleQuestionsForFill(questions, {
      [getQuestionKey(questions[0]!)]: String(ANLASMA_DIGER_DEGIL),
      [getQuestionKey(questions[1]!)]: String(ZIRAAT_DIGER_DEGIL),
    })

    expect(visible.map((item) => item.soruId)).toEqual([10, 20])
  })

  it('places the child under the first matching bagliKosullar parent when both match', () => {
    const questions = sampleQuestions()
    const visible = filterVisibleQuestionsForFill(questions, {
      [getQuestionKey(questions[0]!)]: String(ANLASMA_DIGER),
      [getQuestionKey(questions[1]!)]: String(ZIRAAT_DIGER),
    })

    expect(visible.map((item) => item.soruId)).toEqual([10, 30, 20])
  })

  it('keeps single-parent visibility when bagliKosullar is empty', () => {
    const parent = soru({
      soruId: 1,
      soruMetni: 'Ana soru',
      siraNo: 1,
      altSecenekler: [{ id: 11, adi: 'Evet' }],
    })
    const child = soru({
      soruId: 2,
      soruMetni: 'Bağlı soru',
      siraNo: 2,
      bagliSoru: true,
      bagliOlduguSoruId: 1,
      bagliAltSecenekId: 11,
      bagliKosulTipi: 'esit',
      bagliKosullar: [],
      secenekGrupId: null,
      cevapGirdiTipAdi: 'Metin',
    })

    expect(
      filterVisibleQuestionsForFill([parent, child], {
        [getQuestionKey(parent)]: '11',
      }).map((item) => item.soruId),
    ).toEqual([1, 2])

    expect(
      filterVisibleQuestionsForFill([parent, child], {}).map((item) => item.soruId),
    ).toEqual([1])
  })
})
