import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '@/features/questions/types/question.types'
import {
  getVisibleSoruKolonlari,
  isKontratSahibiDuplicateReportColumn,
} from './visible-soru-kolonlari'

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

describe('isKontratSahibiDuplicateReportColumn', () => {
  it('hides contract-owner fields that already exist on the ekici row', () => {
    expect(isKontratSahibiDuplicateReportColumn('Kontrat sahibi cinsiyet?')).toBe(true)
    expect(isKontratSahibiDuplicateReportColumn('Kontrat sahibi doğum tarihi?')).toBe(true)
    expect(isKontratSahibiDuplicateReportColumn('Kontrat sahibi ad-soyad?')).toBe(true)
  })

  it('keeps producer questions filled by the expert', () => {
    expect(isKontratSahibiDuplicateReportColumn('Üretici cinsiyet?')).toBe(false)
    expect(isKontratSahibiDuplicateReportColumn('Üretici doğum tarihi?')).toBe(false)
    expect(isKontratSahibiDuplicateReportColumn('Üretici ad-soyad?')).toBe(false)
    expect(isKontratSahibiDuplicateReportColumn('Üretimi yapan kişi')).toBe(false)
  })
})

describe('getVisibleSoruKolonlari', () => {
  it('drops duplicate columns and keeps original cevaplar indexes', () => {
    expect(
      getVisibleSoruKolonlari([
        'Kontrat sahibi cinsiyet?',
        'Üretici cinsiyet?',
        'Kontrat sahibi doğum tarihi?',
        'Kontrat sahibi ad-soyad?',
        'Bakmakla yükümlü olduğu kişi sayısı',
      ]),
    ).toEqual([
      { header: 'Üretici cinsiyet?', index: 1 },
      { header: 'Bakmakla yükümlü olduğu kişi sayısı', index: 4 },
    ])
  })

  it('adds active survey questions that the API omitted because nobody answered them', () => {
    const columns = getVisibleSoruKolonlari(
      ['Üretici cinsiyet?'],
      [
        question({ id: 1, soruMetni: 'Üretici cinsiyet?' }),
        question({ id: 2, soruMetni: 'Tarlaya işçi taşıma yöntemi?' }),
        question({ id: 3, soruMetni: 'Pasif soru', aktif: false }),
      ],
    )
    expect(columns.map((column) => ({ header: column.header, index: column.index, outline: column.outline }))).toEqual([
      { header: 'Üretici cinsiyet?', index: 0, outline: '1' },
      { header: 'Tarlaya işçi taşıma yöntemi?', index: -1, outline: '2' },
    ])
  })

  it('repeats a shared child next to every parent and keeps definition outlines', () => {
    const columns = getVisibleSoruKolonlari(
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
          bagliSoru: true,
        }),
        question({
          id: 12,
          soruMetni: 'Üretici çocuğunu getiriyor mu?',
          siraNo: 2,
          bagliSoru: true,
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

    expect(
      columns.map((column) => ({
        outline: column.outline,
        header: column.header,
        index: column.index,
        parentId: column.question?.bagliOlduguSoruId,
      })),
    ).toEqual([
      {
        outline: '1',
        header: 'Yevmiyeli işçi çocuğunu getiriyor mu?',
        index: 0,
        parentId: undefined,
      },
      {
        outline: '1.1',
        header: 'Hangi işlerle ilgileniyor?',
        index: 1,
        parentId: 11,
      },
      {
        outline: '2',
        header: 'Üretici çocuğunu getiriyor mu?',
        index: 2,
        parentId: undefined,
      },
      {
        outline: '2.1',
        header: 'Hangi işlerle ilgileniyor?',
        index: 1,
        parentId: 12,
      },
    ])
  })

  it('hides a passive question but keeps the remaining definition numbers', () => {
    const columns = getVisibleSoruKolonlari(
      ['Bir', 'İki', 'Üç'],
      [
        question({ id: 1, soruMetni: 'Bir', siraNo: 1 }),
        question({ id: 2, soruMetni: 'İki', siraNo: 2, aktif: false }),
        question({ id: 3, soruMetni: 'Üç', siraNo: 3 }),
      ],
    )

    expect(columns.map((column) => `${column.outline} ${column.header}`)).toEqual(['1 Bir', '3 Üç'])
  })
})
