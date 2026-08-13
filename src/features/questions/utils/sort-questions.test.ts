import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '../types/question.types'
import type { QuestionOrderStorage } from './question-order-storage'
import {
  getQuestionMoveState,
  moveQuestionInSurvey,
  sortQuestionsForSurvey,
} from './sort-questions'

function makeQuestion(overrides: Partial<QuestionDto> & Pick<QuestionDto, 'id'>): QuestionDto {
  return {
    baslikId: 1,
    baslikAdi: 'Anket',
    soruMetni: `Soru ${overrides.id}`,
    altSoruMetni: null,
    zorunlu: true,
    aktif: true,
    secenekGrupId: null,
    bagliSoru: false,
    ...overrides,
  }
}

function memoryStorage(initial: Record<number, string[]> = {}): QuestionOrderStorage {
  const store = { ...initial }
  return {
    get: (baslikId) => store[baslikId] ?? null,
    set: (baslikId, ids) => {
      store[baslikId] = ids
    },
  }
}

describe('sortQuestionsForSurvey', () => {
  it('keeps linked questions under their parent and sorts by sira', () => {
    const rows = sortQuestionsForSurvey(
      [
        makeQuestion({ id: 3, soruMetni: 'Son', sira: 3 }),
        makeQuestion({
          id: 2,
          soruMetni: 'Bağlı',
          bagliSoru: true,
          bagliOlduguSoruId: 1,
          sira: 2,
        }),
        makeQuestion({ id: 1, soruMetni: 'İlk', sira: 1 }),
      ],
      memoryStorage(),
    )

    expect(rows.map((row) => row.soruMetni)).toEqual(['İlk', 'Bağlı', 'Son'])
    expect(rows.map((row) => row.sira)).toEqual([1, 2, 3])
  })

  it('uses stored order when API sira is missing', () => {
    const rows = sortQuestionsForSurvey(
      [
        makeQuestion({ id: 10, soruMetni: 'A' }),
        makeQuestion({ id: 11, soruMetni: 'B' }),
        makeQuestion({ id: 12, soruMetni: 'C' }),
      ],
      memoryStorage({ 1: ['12', '10', '11'] }),
    )

    expect(rows.map((row) => row.soruMetni)).toEqual(['C', 'A', 'B'])
  })
})

describe('moveQuestionInSurvey', () => {
  it('moves a root question with its children', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Bir', sira: 1 }),
      makeQuestion({
        id: 2,
        soruMetni: 'Bir bağlı',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        sira: 2,
      }),
      makeQuestion({ id: 3, soruMetni: 'İki', sira: 3 }),
    ]

    const moved = moveQuestionInSurvey(questions, 3, 'up', memoryStorage())
    expect(moved.map((row) => row.soruMetni)).toEqual(['İki', 'Bir', 'Bir bağlı'])
  })

  it('does not move the first sibling up', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Bir', sira: 1 }),
      makeQuestion({ id: 2, soruMetni: 'İki', sira: 2 }),
    ]
    expect(getQuestionMoveState(questions, 1, memoryStorage())).toEqual({
      canMoveUp: false,
      canMoveDown: true,
    })
    expect(moveQuestionInSurvey(questions, 1, 'up', memoryStorage()).map((row) => row.id)).toEqual([
      1, 2,
    ])
  })
})
