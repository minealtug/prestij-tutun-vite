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
    expect(questions.map((column) => column.row1)).toEqual([1, 2])
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
})
