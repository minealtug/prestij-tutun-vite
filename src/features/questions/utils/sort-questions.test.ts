import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '../types/question.types'
import {
  getQuestionDisplayMeta,
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

describe('getQuestionDisplayMeta', () => {
  it('assigns outline numbers so linked questions nest under their parent', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Ana', siraNo: 1 }),
      makeQuestion({
        id: 2,
        soruMetni: 'Bağlı A',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 2,
      }),
      makeQuestion({
        id: 3,
        soruMetni: 'Bağlı B',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 3,
      }),
      makeQuestion({
        id: 4,
        soruMetni: 'Alt bağlı',
        bagliSoru: true,
        bagliOlduguSoruId: 2,
        siraNo: 4,
      }),
      makeQuestion({ id: 5, soruMetni: 'Son', siraNo: 5 }),
    ]

    const meta = getQuestionDisplayMeta(questions)
    expect(meta.get('1')).toEqual({ depth: 0, outline: '1' })
    expect(meta.get('2')).toEqual({ depth: 1, outline: '1.1' })
    expect(meta.get('4')).toEqual({ depth: 2, outline: '1.1.1' })
    expect(meta.get('3')).toEqual({ depth: 1, outline: '1.2' })
    expect(meta.get('5')).toEqual({ depth: 0, outline: '2' })
  })
})

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

  it('reorders linked questions among siblings under the same parent', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Ana', siraNo: 1 }),
      makeQuestion({
        id: 2,
        soruMetni: 'Bağlı A',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 2,
      }),
      makeQuestion({
        id: 3,
        soruMetni: 'Bağlı B',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 3,
      }),
      makeQuestion({ id: 4, soruMetni: 'Son', siraNo: 4 }),
    ]

    expect(getQuestionMoveState(questions, 2)).toEqual({
      canMoveUp: false,
      canMoveDown: true,
    })
    expect(getQuestionMoveState(questions, 3)).toEqual({
      canMoveUp: true,
      canMoveDown: false,
    })

    const moved = moveQuestionInSurvey(questions, 3, 'up')
    expect(moved.map((row) => row.soruMetni)).toEqual(['Ana', 'Bağlı B', 'Bağlı A', 'Son'])
    expect(toSiraUpdateItems(moved)).toEqual([
      { id: 1, siraNo: 1 },
      { id: 3, siraNo: 2 },
      { id: 2, siraNo: 3 },
      { id: 4, siraNo: 4 },
    ])
  })

  it('moves a linked question together with its nested children', () => {
    const questions = [
      makeQuestion({ id: 1, soruMetni: 'Ana', siraNo: 1 }),
      makeQuestion({
        id: 2,
        soruMetni: 'Bağlı A',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 2,
      }),
      makeQuestion({
        id: 3,
        soruMetni: 'Alt bağlı A',
        bagliSoru: true,
        bagliOlduguSoruId: 2,
        siraNo: 3,
      }),
      makeQuestion({
        id: 4,
        soruMetni: 'Bağlı B',
        bagliSoru: true,
        bagliOlduguSoruId: 1,
        siraNo: 4,
      }),
    ]

    const moved = moveQuestionInSurvey(questions, 4, 'up')
    expect(moved.map((row) => row.soruMetni)).toEqual([
      'Ana',
      'Bağlı B',
      'Bağlı A',
      'Alt bağlı A',
    ])
  })
})
