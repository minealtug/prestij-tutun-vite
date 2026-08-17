import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '../types/question.types'
import {
  getQuestionMoveState,
  moveQuestionInSurvey,
  sortQuestionsForSurvey,
  toSiraUpdateItems,
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

describe('sortQuestionsForSurvey', () => {
  it('keeps linked questions under their parent and sorts by siraNo', () => {
    const rows = sortQuestionsForSurvey([
      makeQuestion({ id: 3, soruMetni: 'Son', siraNo: 3 }),
      makeQuestion({
        id: 2,
        soruMetni: 'Bağlı',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 2,
      }),
      makeQuestion({ id: 1, soruMetni: 'İlk', siraNo: 1 }),
    ])

    expect(rows.map((row) => row.soruMetni)).toEqual(['İlk', 'Bağlı', 'Son'])
    expect(rows.map((row) => row.siraNo)).toEqual([1, 2, 3])
  })
})

describe('moveQuestionInSurvey', () => {
  it('moves a root question with its children', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Bir', siraNo: 1 }),
      makeQuestion({
        id: 2,
        soruMetni: 'Bir bağlı',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 2,
      }),
      makeQuestion({ id: 3, soruMetni: 'İki', siraNo: 3 }),
    ]

    const moved = moveQuestionInSurvey(questions, 3, 'up')
    expect(moved.map((row) => row.soruMetni)).toEqual(['İki', 'Bir', 'Bir bağlı'])
    expect(toSiraUpdateItems(moved)).toEqual([
      { id: 3, siraNo: 1 },
      { id: 1, siraNo: 2 },
      { id: 2, siraNo: 3 },
    ])
  })

  it('does not move the first sibling up', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Bir', siraNo: 1 }),
      makeQuestion({ id: 2, soruMetni: 'İki', siraNo: 2 }),
    ]
    expect(getQuestionMoveState(questions, 1)).toEqual({
      canMoveUp: false,
      canMoveDown: true,
    })
    expect(moveQuestionInSurvey(questions, 1, 'up').map((row) => row.id)).toEqual([1, 2])
  })
})
