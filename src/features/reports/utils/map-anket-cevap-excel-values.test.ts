import { describe, expect, it } from 'vitest'
import type { QuestionDto } from '@/features/questions/types/question.types'
import { ANKET_CEVAPLARI_EXCEL_COLUMNS } from '../config/anket-cevaplari-excel-columns'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import { buildAnketCevapExcelSources } from './anket-cevap-excel-source'
import {
  joinUniqueComma,
  resolveAnketCevapExcelCell,
  formatExcelDateText,
} from './map-anket-cevap-excel-values'

function question(partial: Partial<QuestionDto> & Pick<QuestionDto, 'id' | 'soruMetni'>): QuestionDto {
  return {
    baslikId: 1,
    baslikAdi: 'STP',
    altSoruMetni: null,
    zorunlu: false,
    aktif: true,
    secenekGrupId: null,
    bagliSoru: false,
    ...partial,
  }
}

function row(cevaplar: string[], extra: Partial<AnketCevapRow> = {}): AnketCevapRow {
  return {
    rowKey: '1-0',
    ekiciId: '1',
    baslikId: 1,
    sablonId: 1,
    anketAdi: 'STP ANKETİ',
    menseiId: 1,
    bolgeId: 1,
    mintikaId: 1,
    alimNoktasiId: 1,
    koyId: 1,
    mensei: 'IZMIR',
    mintika: 'AKHİSAR',
    alimNoktasi: 'AKHİSAR',
    koy: 'HAMİTKÖY',
    tc: '23924336642',
    adi: 'MEHMET ALİ',
    soyadi: 'TURAN',
    dogumTarihi: '01.02.2001',
    sozlesmeKg: 500,
    donum: 6,
    cinsiyet: 'Erkek',
    ekiciYasAraligi: '18-30 Yaş Ekici',
    uretimiYapan: 'Kontrat Sahibi',
    cevaplar,
    ...extra,
  }
}

function col(letter: string) {
  const column = ANKET_CEVAPLARI_EXCEL_COLUMNS.find((item) => item.letter === letter)
  if (!column) throw new Error(letter)
  return column
}

describe('ANKET_CEVAPLARI_EXCEL_COLUMNS', () => {
  it('omits Sözleşme Kg / Dönüm and keeps A–K producer headers', () => {
    expect(ANKET_CEVAPLARI_EXCEL_COLUMNS).toHaveLength(99)
    expect(ANKET_CEVAPLARI_EXCEL_COLUMNS.slice(0, 11).map((item) => item.title)).toEqual([
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
    expect(ANKET_CEVAPLARI_EXCEL_COLUMNS.some((item) => item.title === 'Sözleşme Kg')).toBe(false)
    expect(ANKET_CEVAPLARI_EXCEL_COLUMNS.some((item) => item.title === 'Dönüm')).toBe(false)
    expect(col('J').source).toMatchObject({ type: 'fixed', key: 'cinsiyet' })
    expect(colByTitle('Anlaşma Şekli (Genel Durum)').letter).toBe('AJ')
    expect(colByTitle('Gübreyi belirleme şekli?').letter).toBe('BG')
  })
})

describe('joinUniqueComma', () => {
  it('dedupes, trims and joins without spaces', () => {
    expect(joinUniqueComma(['Tuvalet, İçme Suyu', 'İçme Suyu', 'Elektrik'], ['İçme Suyu', 'Elektrik', 'Tuvalet'])).toBe(
      'İçme Suyu,Elektrik,Tuvalet',
    )
  })
})

function colByTitle(title: string) {
  const column = ANKET_CEVAPLARI_EXCEL_COLUMNS.find((item) => item.title === title)
  if (!column) throw new Error(title)
  return column
}

describe('resolveAnketCevapExcelCell', () => {
  it('leaves alım noktası, köy, TC, ad and soyad empty and drops kg/dönüm columns', () => {
    const record = row([])
    expect(resolveAnketCevapExcelCell(col('D'), record, [])).toBe(null)
    expect(resolveAnketCevapExcelCell(col('E'), record, [])).toBe(null)
    expect(resolveAnketCevapExcelCell(col('F'), record, [])).toBe(null)
    expect(resolveAnketCevapExcelCell(col('G'), record, [])).toBe(null)
    expect(resolveAnketCevapExcelCell(col('H'), record, [])).toBe(null)
    expect(resolveAnketCevapExcelCell(col('J'), record, [])).toBe('Erkek')
    expect(resolveAnketCevapExcelCell(col('K'), record, [])).toBe('18-30 Yaş Ekici')
  })

  it('uses the active tarla-ownership branch and leaves the other empty', () => {
    const sources = buildAnketCevapExcelSources(
      ['Tarla sahiplik durumu?', 'İcarlanan tarla bedeli?', 'İcarlanan tarla bedeli?'],
      [
        question({ id: 1, soruMetni: 'Tarla sahiplik durumu?' }),
        question({
          id: 2,
          soruMetni: 'İcarlanan tarla bedeli?',
          bagliSoru: true,
          bagliOlduguSoruId: 1,
          bagliAltSecenekId: 11,
        }),
        question({
          id: 3,
          soruMetni: 'İcarlanan tarla bedeli?',
          bagliSoru: true,
          bagliOlduguSoruId: 1,
          bagliAltSecenekId: 12,
        }),
      ],
      new Map([
        [11, 'İcar'],
        [12, 'Kendi+İcar'],
      ]),
    )
    const icar = row(['İcar', '17000', '27000'])
    const both = row(['Kendi+İcar', '17000', '27000'])
    expect(resolveAnketCevapExcelCell(colByTitle('İcarlanan tarla bedeli?'), icar, sources)).toBe('17000')
    expect(resolveAnketCevapExcelCell(colByTitle('İcarlanan tarla bedeli?'), both, sources)).toBe('27000')
  })

  it('joins living-condition options that were answered Evet', () => {
    const sources = buildAnketCevapExcelSources(
      [
        'İşçi tarla koşulları?',
        'Bireylerin bu koşullara erişme imkanı var mı?',
        'Bireylerin bu koşullara erişme imkanı var mı?',
        'Bireylerin bu koşullara erişme imkanı var mı?',
      ],
      [
        question({ id: 10, soruMetni: 'İşçi tarla koşulları?' }),
        question({
          id: 11,
          soruMetni: 'Bireylerin bu koşullara erişme imkanı var mı?',
          bagliSoru: true,
          bagliOlduguSoruId: 10,
          bagliAltSecenekId: 21,
        }),
        question({
          id: 12,
          soruMetni: 'Bireylerin bu koşullara erişme imkanı var mı?',
          bagliSoru: true,
          bagliOlduguSoruId: 10,
          bagliAltSecenekId: 22,
        }),
        question({
          id: 13,
          soruMetni: 'Bireylerin bu koşullara erişme imkanı var mı?',
          bagliSoru: true,
          bagliOlduguSoruId: 10,
          bagliAltSecenekId: 23,
        }),
      ],
      new Map([
        [21, 'Tuvalet'],
        [22, 'İçme Suyu'],
        [23, 'Elektrik'],
      ]),
    )
    const record = row(['Tuvalet, İçme Suyu', 'Evet', 'Evet', 'Hayır'])
    expect(resolveAnketCevapExcelCell(colByTitle('İşçi tarla koşulları?  ( Bireylerin bu koşullara erişme imkanı var mı?)'), record, sources)).toBe('İçme Suyu,Tuvalet')
  })

  it('does not treat the 18-age child-labour question as the target CT column', () => {
    const sources = buildAnketCevapExcelSources(
      ['Yevmiyeli işçi, 18 yaşından küçük kendi çocuğunu tarlaya getiriyor mu?'],
      [question({ id: 40, soruMetni: 'Yevmiyeli işçi, 18 yaşından küçük kendi çocuğunu tarlaya getiriyor mu?' })],
    )
    const record = row(['Hayır'])
    expect(resolveAnketCevapExcelCell(colByTitle('Yevmiyeli işçi, kendi çocuğunu tarlaya getiriyor mu? '), record, sources)).toBe(null)
  })

  it('leaves unanswered dependents count blank instead of 0', () => {
    const sources = buildAnketCevapExcelSources(
      ['Ailede bakmakla yükümlü olunan birey sayısı?'],
      [question({ id: 2, soruMetni: 'Ailede bakmakla yükümlü olunan birey sayısı?' })],
    )
    expect(resolveAnketCevapExcelCell(colByTitle('Ailede bakmakla yükümlü olunan birey sayısı?'), row(['0']), sources)).toBe(null)
    expect(resolveAnketCevapExcelCell(colByTitle('Ailede bakmakla yükümlü olunan birey sayısı?'), row(['3']), sources)).toBe('3')
  })

  it('formats family dates as dd.MM.yyyy', () => {
    expect(formatExcelDateText('1971-01-01')).toBe('01.01.1971')
    const sources = buildAnketCevapExcelSources(
      ['1.Bireyin doğum tarihi?'],
      [question({ id: 4, soruMetni: '1.Bireyin doğum tarihi?' })],
    )
    expect(resolveAnketCevapExcelCell(colByTitle('1.Bireyin doğum tarihi?'), row(['1971-01-01']), sources)).toBe('01.01.1971')
  })
})
