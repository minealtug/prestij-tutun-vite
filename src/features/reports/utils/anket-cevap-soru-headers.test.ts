import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '@/features/questions/types/question.types'
import {
  getAnketCevapSoruTableHeader,
  groupAnketCevapSoruColumns,
  resolveAnketCevapSoruColumns,
} from './anket-cevap-soru-headers'

function question(partial: Partial<QuestionDto> & Pick<QuestionDto, 'id' | 'soruMetni'>): QuestionDto {
  return {
    baslikId: 1,
    baslikAdi: 'Anket',
    altSoruMetni: null,
    zorunlu: false,
    aktif: true,
    secenekGrupId: null,
    bagliSoru: false,
    ...partial,
  }
}

describe('resolveAnketCevapSoruColumns', () => {
  it('groups identical linked questions under the previous parent header', () => {
    const columns = resolveAnketCevapSoruColumns([
      { header: 'Üretici yaşam koşulları?', index: 0 },
      { header: 'Bireylerin bu koşula erişme imkanı var mı?', index: 1 },
      { header: 'Bireylerin bu koşula erişme imkanı var mı?', index: 2 },
      { header: 'Bireylerin bu koşula erişme imkanı var mı?', index: 3 },
    ])

    expect(columns.map((column) => column.groupKey)).toEqual(['col-0', 'col-0', 'col-0', 'col-0'])
    expect(columns.slice(1).every((column) => column.isChild)).toBe(true)
    expect(columns[1]?.parentHeader).toBe('Üretici yaşam koşulları?')
  })

  it('uses question metadata and option names for child headers', () => {
    const columns = resolveAnketCevapSoruColumns(
      [
        { header: 'Üretici yaşam koşulları?', index: 0 },
        { header: 'Bireylerin bu koşula erişme imkanı var mı?', index: 1 },
        { header: 'Bireylerin bu koşula erişme imkanı var mı?', index: 2 },
      ],
      [
        question({ id: 10, soruMetni: 'Üretici yaşam koşulları?' }),
        question({
          id: 11,
          soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
          bagliSoru: true,
          bagliOlduguSoruId: 10,
          bagliAltSecenekId: 21,
        }),
        question({
          id: 12,
          soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
          bagliSoru: true,
          bagliOlduguSoruId: 10,
          bagliAltSecenekId: 22,
        }),
      ],
      new Map([
        [21, 'Tuvalet'],
        [22, 'Duş'],
      ]),
    )

    expect(columns[1]).toMatchObject({
      isChild: true,
      parentHeader: 'Üretici yaşam koşulları?',
      subHeader: 'Tuvalet: Bireylerin bu koşula erişme imkanı var mı?',
      groupKey: 'q-10',
    })
    expect(columns[2]?.subHeader).toBe('Duş: Bireylerin bu koşula erişme imkanı var mı?')
    expect(groupAnketCevapSoruColumns(columns)).toHaveLength(1)
    expect(getAnketCevapSoruTableHeader(columns[1]!)).toContain('Tuvalet')
  })
})
