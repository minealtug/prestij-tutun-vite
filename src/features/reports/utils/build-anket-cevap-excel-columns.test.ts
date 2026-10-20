import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '@/features/questions/types/question.types'
import {
  ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT,
  buildAnketCevapExcelSheetColumns,
} from './build-anket-cevap-excel-columns'

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

describe('buildAnketCevapExcelSheetColumns', () => {
  it('keeps identity columns and orders questions by siraNo, not by the API column list', () => {
    const columns = buildAnketCevapExcelSheetColumns(
      ['İkinci soru?', 'Birinci soru?'],
      [
        question({ id: 1, soruMetni: 'Birinci soru?', siraNo: 2 }),
        question({ id: 2, soruMetni: 'İkinci soru?', siraNo: 1 }),
      ],
    )

    expect(columns.slice(0, ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT).map((column) => column.title)).toEqual([
      'Anket Adı',
      'Menşei',
      'Mıntıka',
      'Alım Noktası',
      'Köy',
      'TC',
      'Adı',
      'Soyadı',
      'Doğum Tarihi',
      'Cinsiyet',
      'Ekici Yaş Aralığı',
    ])

    const questions = columns.slice(ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT)
    expect(questions.map((column) => column.title)).toEqual(['İkinci soru?', 'Birinci soru?'])
    expect(questions.map((column) => column.row1)).toEqual(['1', '2'])
    expect(questions.map((column) => column.answerIndex)).toEqual([0, 1])
  })

  it('moves a question in excel when its siraNo changes', () => {
    const headers = ['Birinci soru?', 'İkinci soru?']
    const before = buildAnketCevapExcelSheetColumns(headers, [
      question({ id: 1, soruMetni: 'Birinci soru?', siraNo: 1 }),
      question({ id: 2, soruMetni: 'İkinci soru?', siraNo: 2 }),
    ])
    const after = buildAnketCevapExcelSheetColumns(headers, [
      question({ id: 1, soruMetni: 'Birinci soru?', siraNo: 2 }),
      question({ id: 2, soruMetni: 'İkinci soru?', siraNo: 1 }),
    ])

    const titles = (columns: ReturnType<typeof buildAnketCevapExcelSheetColumns>) =>
      columns.slice(ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT).map((column) => column.title)

    expect(titles(before)).toEqual(['Birinci soru?', 'İkinci soru?'])
    expect(titles(after)).toEqual(['İkinci soru?', 'Birinci soru?'])
  })

  it('writes only the linked question on child columns', () => {
    const columns = buildAnketCevapExcelSheetColumns(
      ['Ailede bakmakla yükümlü olunan birey sayısı?', '1.Bireyin cinsiyeti?'],
      [
        question({ id: 1, soruMetni: 'Ailede bakmakla yükümlü olunan birey sayısı?', siraNo: 1 }),
        question({
          id: 2,
          soruMetni: '1.Bireyin cinsiyeti?',
          siraNo: 2,
          bagliSoru: true,
          bagliOlduguSoruId: 1,
        }),
      ],
    )

    const questions = columns.slice(ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT)
    expect(questions.map((column) => column.title)).toEqual([
      'Ailede bakmakla yükümlü olunan birey sayısı?',
      '1.Bireyin cinsiyeti?',
    ])
  })

  it('drops any parent answer from the question title, not only Evet', () => {
    const columns = buildAnketCevapExcelSheetColumns(
      [
        'İşçi çalıştırıyor musunuz?',
        'Evet — Anlaşma Şekli (Genel Durum)',
        'Günlük — Sezonda çalıştırdığı işçi sayısı?',
        'Hayır — Göçmen işçi çalıştırıyor mu?',
      ],
      [
        question({ id: 1, soruMetni: 'İşçi çalıştırıyor musunuz?', siraNo: 1 }),
        question({
          id: 2,
          soruMetni: 'Evet — Anlaşma Şekli (Genel Durum)',
          siraNo: 2,
          bagliSoru: true,
          bagliOlduguSoruId: 1,
          bagliAltSecenekId: 21,
        }),
        question({
          id: 3,
          soruMetni: 'Günlük — Sezonda çalıştırdığı işçi sayısı?',
          siraNo: 3,
          bagliSoru: true,
          bagliOlduguSoruId: 1,
          bagliAltSecenekId: 22,
        }),
        question({
          id: 4,
          soruMetni: 'Hayır — Göçmen işçi çalıştırıyor mu?',
          siraNo: 4,
          bagliSoru: true,
          bagliOlduguSoruId: 1,
          bagliAltSecenekId: 23,
        }),
      ],
      new Map([
        [21, 'Evet'],
        [22, 'Günlük'],
        [23, 'Hayır'],
      ]),
    )

    expect(columns.slice(ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT).map((column) => column.title)).toEqual([
      'İşçi çalıştırıyor musunuz?',
      'Anlaşma Şekli (Genel Durum)',
      'Sezonda çalıştırdığı işçi sayısı?',
      'Göçmen işçi çalıştırıyor mu?',
    ])
  })

  it('writes a shared child once under each parent with definition numbers', () => {
    const columns = buildAnketCevapExcelSheetColumns(
      [
        'Yevmiyeli işçi çocuğunu getiriyor mu?',
        'Hangi işlerle ilgileniyor?',
        'Üretici çocuğunu getiriyor mu?',
      ],
      [
        question({
          id: 11,
          soruMetni: 'Yevmiyeli işçi çocuğunu getiriyor mu?',
          siraNo: 1,
        }),
        question({
          id: 12,
          soruMetni: 'Üretici çocuğunu getiriyor mu?',
          siraNo: 2,
        }),
        question({
          id: 13,
          soruMetni: 'Hangi işlerle ilgileniyor?',
          siraNo: 3,
          bagliSoru: true,
          bagliOlduguSoruId: 11,
          bagliKosullar: [{ parentSoruId: 11 }, { parentSoruId: 12 }],
        }),
      ],
    )

    const questions = columns.slice(ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT)
    expect(questions.map((column) => column.row1)).toEqual(['1', '1,1', '2', '2,1'])
    expect(questions.map((column) => column.title)).toEqual([
      'Yevmiyeli işçi çocuğunu getiriyor mu?',
      'Hangi işlerle ilgileniyor?',
      'Üretici çocuğunu getiriyor mu?',
      'Hangi işlerle ilgileniyor?',
    ])
    expect(questions.map((column) => column.answerIndex)).toEqual([0, 1, 2, 1])
  })

  it('keeps the 20th child outline as 2,20 instead of collapsing it to 2,2', () => {
    const children = Array.from({ length: 20 }, (_, index) => {
      const n = index + 1
      return question({
        id: 10 + n,
        soruMetni: `${n}. bağlı soru?`,
        siraNo: n,
        bagliSoru: true,
        bagliOlduguSoruId: 2,
      })
    })
    const columns = buildAnketCevapExcelSheetColumns(
      ['İlk ana?', 'Ana soru?', ...children.map((child) => child.soruMetni)],
      [
        question({ id: 1, soruMetni: 'İlk ana?', siraNo: 1 }),
        question({ id: 2, soruMetni: 'Ana soru?', siraNo: 2 }),
        ...children,
      ],
    )
    const numbers = columns.slice(ANKET_CEVAPLARI_EXCEL_FIXED_COLUMN_COUNT).map((column) => column.row1)

    expect(numbers[3]).toBe('2,2')
    expect(numbers[21]).toBe('2,20')
  })
})
