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
    expect(
      getVisibleSoruKolonlari(
        ['Üretici cinsiyet?'],
        [
          question({ id: 1, soruMetni: 'Üretici cinsiyet?' }),
          question({ id: 2, soruMetni: 'Tarlaya işçi taşıma yöntemi?' }),
          question({ id: 3, soruMetni: 'Pasif soru', aktif: false }),
        ],
      ),
    ).toEqual([
      { header: 'Üretici cinsiyet?', index: 0 },
      { header: 'Tarlaya işçi taşıma yöntemi?', index: -1 },
    ])
  })
})
