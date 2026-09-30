import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import { excelColumnLetter } from './anket-cevaplari-excel-template'

export type ExcelRow1Kind = 'none' | 'int' | 'decimal' | 'decimalEmpty'
export type ExcelValueKind = 'text' | 'number' | 'dateExcel' | 'dateText'
export type ExcelDataStyle = 'gray' | 'date' | 'white'

export interface QuestionMatch {
  /** Kaynak soru metni (normalize edilerek eşitlik) */
  question: string | string[]
  parent?: string
  option?: string
  /** Bu ifadeler kaynak soru/başlıkta varsa eşleşme reddedilir */
  exclude?: string[]
}

export type ExcelValueSource =
  | { type: 'fixed'; key: keyof AnketCevapRow }
  | { type: 'question'; match: QuestionMatch }
  | {
      type: 'activeBranch'
      parent: QuestionMatch
      branches: { when: string; match: QuestionMatch }[]
    }
  | { type: 'joinYesOptions'; parent: QuestionMatch }
  | { type: 'joinMulti'; match: QuestionMatch }

export interface AnketCevapExcelColumn {
  letter: string
  row1Kind: ExcelRow1Kind
  row1Value?: number
  title: string
  valueKind: ExcelValueKind
  dataStyle: ExcelDataStyle
  /** Excel’de başlık durur, hücre boş yazılır (rapor tablosunu etkilemez). */
  blank?: boolean
  source: ExcelValueSource
}

function col(
  letter: string,
  row1Kind: ExcelRow1Kind,
  title: string,
  source: ExcelValueSource,
  options?: { row1Value?: number; valueKind?: ExcelValueKind; dataStyle?: ExcelDataStyle; blank?: boolean },
): AnketCevapExcelColumn {
  const isFixed = source.type === 'fixed'
  return {
    letter,
    row1Kind,
    row1Value: options?.row1Value,
    title,
    valueKind: options?.valueKind ?? 'text',
    dataStyle: options?.dataStyle ?? (isFixed ? 'gray' : 'white'),
    blank: options?.blank,
    source,
  }
}

function fixed(
  letter: string,
  title: string,
  key: keyof AnketCevapRow,
  extra?: {
    row1Kind?: ExcelRow1Kind
    row1Value?: number
    valueKind?: ExcelValueKind
    dataStyle?: ExcelDataStyle
    blank?: boolean
  },
): AnketCevapExcelColumn {
  return col(letter, extra?.row1Kind ?? 'none', title, { type: 'fixed', key }, extra)
}

function q(
  letter: string,
  title: string,
  question: string | string[],
  extra?: {
    row1Kind?: ExcelRow1Kind
    row1Value?: number
    parent?: string
    option?: string
    exclude?: string[]
    valueKind?: ExcelValueKind
    kind?: 'question' | 'joinMulti'
  },
): AnketCevapExcelColumn {
  const match: QuestionMatch = {
    question,
    parent: extra?.parent,
    option: extra?.option,
    exclude: extra?.exclude,
  }
  return col(
    letter,
    extra?.row1Kind ?? 'none',
    title,
    extra?.kind === 'joinMulti' ? { type: 'joinMulti', match } : { type: 'question', match },
    { row1Value: extra?.row1Value, valueKind: extra?.valueKind },
  )
}

function bireyPair(
  startLetter: string,
  nextLetter: string,
  n: number,
  cinsiyetNo: number,
  dogumNo: number,
): AnketCevapExcelColumn[] {
  const cinsiyetTitle = n === 9 ? '9.Bireyin cinsiyeti' : `${n}.Bireyin cinsiyeti?`
  return [
    q(startLetter, cinsiyetTitle, `${n}.Bireyin cinsiyeti`, {
      row1Kind: 'int',
      row1Value: cinsiyetNo,
    }),
    q(nextLetter, `${n}.Bireyin doğum tarihi?`, `${n}.Bireyin doğum tarihi`, {
      row1Kind: 'int',
      row1Value: dogumNo,
      valueKind: 'dateText',
    }),
  ]
}

/**
 * Hedef şablon sütunları (Sözleşme Kg / Dönüm Excel’de yok).
 * Kaynak eşleştirme soru metni / bağlı üst soru / seçenek adı ile yapılır; sütun indeksine göre kopyalanmaz.
 */
const EXCEL_COLUMN_DEFS: AnketCevapExcelColumn[] = [
  fixed('A', 'Anket Adı', 'anketAdi'),
  fixed('B', 'Menşei', 'mensei'),
  fixed('C', 'Mıntıka', 'mintika'),
  fixed('D', 'Alım Noktası', 'alimNoktasi', { blank: true }),
  fixed('E', 'Köy', 'koy', { blank: true }),
  fixed('F', 'TC', 'tc', { blank: true }),
  fixed('G', 'Adı', 'adi', { blank: true }),
  fixed('H', 'Soyadı', 'soyadi', { blank: true }),
  fixed('I', 'Doğum Tarihi', 'dogumTarihi', { valueKind: 'dateExcel', dataStyle: 'date' }),
  fixed('J', 'Cinsiyet', 'cinsiyet'),
  fixed('K', 'Ekici Yaş Aralığı', 'ekiciYasAraligi', {
    row1Kind: 'int',
    row1Value: 0,
    dataStyle: 'white',
  }),

  q('N', 'Üretimi yapan? (Kontrat Sahibi/Yetiştirici) ', 'Üretimi yapan', {
    row1Kind: 'int',
    row1Value: 1,
  }),
  q('O', 'Cinsiyet?', 'Yetiştirici cinsiyet', { row1Kind: 'decimal', row1Value: 1.1 }),
  col('P', 'decimalEmpty', 'Doğum Tarihi?', {
    type: 'question',
    match: { question: 'Yetiştirici doğum tarihi' },
  }, { valueKind: 'dateText' }),
  col('Q', 'decimalEmpty', 'Yetiştirici Ad-Soyad?', {
    type: 'question',
    match: { question: ['Yetiştirici ad-soyad', 'Yetiştirici Ad-Soyad'] },
  }),

  q('R', 'Ailede bakmakla yükümlü olunan birey sayısı?', 'Ailede bakmakla yükümlü olunan birey sayısı', {
    row1Kind: 'int',
    row1Value: 2,
  }),
  ...bireyPair('S', 'T', 1, 3, 4),
  ...bireyPair('U', 'V', 2, 5, 6),
  ...bireyPair('W', 'X', 3, 7, 8),
  ...bireyPair('Y', 'Z', 4, 9, 10),
  ...bireyPair('AA', 'AB', 5, 11, 12),
  ...bireyPair('AC', 'AD', 6, 13, 14),
  ...bireyPair('AE', 'AF', 7, 15, 16),
  ...bireyPair('AG', 'AH', 8, 17, 18),
  ...bireyPair('AI', 'AJ', 9, 19, 20),

  q('AK', 'İşçi çalıştırıyor musunuz? (Ücret karşılığında )', 'İşçi çalıştırıyor musunuz', {
    row1Kind: 'int',
    row1Value: 23,
  }),
  q('AL', 'Anlaşma Şekli (Genel Durum)', 'Anlaşma Şekli (Genel Durum)', {
    row1Kind: 'decimal',
    row1Value: 23.1,
  }),
  col('AM', 'decimalEmpty', 'Dayıbaşından işçi temin ediyor mu ?', {
    type: 'question',
    match: { question: 'Dayıbaşından işçi temin ediyor mu' },
  }),
  col('AN', 'decimalEmpty', 'Göçmen işçi çalıştırıyor mu ?', {
    type: 'question',
    match: { question: 'Göçmen işçi çalıştırıyor mu' },
  }),
  col('AO', 'decimalEmpty', 'Sezonda çalıştırdığı işçi sayısı? (Yevmiye Sayısı)', {
    type: 'question',
    match: { question: 'Sezonda çalıştırdığı işçi sayısı' },
  }),
  col('AP', 'decimalEmpty', 'Tarlaya işçi taşıma yöntemi?', {
    type: 'joinMulti',
    match: { question: 'Tarlaya işçi taşıma yöntemi', exclude: ['açıklayınız', 'aciklayiniz'] },
  }),
  col('AQ', 'decimalEmpty', 'Yapılan ziraat türü?', {
    type: 'question',
    match: { question: 'Yapılan ziraat türü' },
  }),
  col('AR', 'decimalEmpty', 'Yatılı işçi çalıştırıyor mu? ( İşçi çalıştırıyor ise)', {
    type: 'question',
    match: { question: 'Yatılı işçi çalıştırıyor mu' },
  }),
  q('AS', 'Günlük yevmiye ücreti?', 'Günlük yevmiye ücreti', {
    row1Kind: 'decimal',
    row1Value: 23.2,
  }),
  col('AT', 'decimalEmpty', 'İşçi konaklama koşulları?  ( Bireylerin bu koşullara erişme imkanı var mı?)', {
    type: 'joinYesOptions',
    parent: { question: 'İşçi konaklama koşulları' },
  }),
  col('AU', 'decimalEmpty', 'İşçi tarla koşulları?  ( Bireylerin bu koşullara erişme imkanı var mı?)', {
    type: 'joinYesOptions',
    parent: { question: 'İşçi tarla koşulları' },
  }),
  col('AV', 'decimalEmpty', 'Tarlaya işçi taşıma yöntemini açıklayınız?', {
    type: 'question',
    match: { question: 'Tarlaya işçi taşıma yöntemini açıklayınız' },
  }),

  q('AW', 'Tütün haricinde farklı bir gelir kaynağı var mı?', 'Tütün haricinde farklı bir gelir kaynağı var mı', {
    row1Kind: 'int',
    row1Value: 24,
  }),
  q('AX', 'Gelir Kaynağı Nedir?', ['Gelir kaynağı nedir', 'Gelir Kaynağı Nedir'], {
    row1Kind: 'int',
    row1Value: 24.1,
    kind: 'joinMulti',
  }),
  q('AY', 'Tarla sahiplik durumu ?', 'Tarla sahiplik durumu', { row1Kind: 'int', row1Value: 25 }),
  col('AZ', 'decimal', 'İcarlanan tarla bedeli?', {
    type: 'activeBranch',
    parent: { question: 'Tarla sahiplik durumu' },
    branches: [
      { when: 'İcar', match: { question: 'İcarlanan tarla bedeli', option: 'İcar' } },
      { when: 'Kendi+İcar', match: { question: 'İcarlanan tarla bedeli', option: 'Kendi+İcar' } },
    ],
  }, { row1Value: 25.1 }),
  col('BA', 'decimalEmpty', 'İcarlanan tarla dekarı?', {
    type: 'activeBranch',
    parent: { question: 'Tarla sahiplik durumu' },
    branches: [
      { when: 'İcar', match: { question: 'İcarlanan tarla dekarı', option: 'İcar' } },
      { when: 'Kendi+İcar', match: { question: 'İcarlanan tarla dekarı', option: 'Kendi+İcar' } },
    ],
  }),
  col('BB', 'decimalEmpty', 'Kendine ait tarla dekar?', {
    type: 'activeBranch',
    parent: { question: 'Tarla sahiplik durumu' },
    branches: [
      { when: 'Kendi', match: { question: 'Kendine ait tarla dekar', option: 'Kendi' } },
      { when: 'Kendi+İcar', match: { question: 'Kendine ait tarla dekar', option: 'Kendi+İcar' } },
    ],
  }),

  q(
    'BC',
    'Son 5 yılda ekicinin dikili arazisi olumsuz hava koşullarından etkilendi mi?',
    'Son 5 yılda ekicinin dikili arazisi olumsuz hava koşullarından etkilendi mi',
    { row1Kind: 'int', row1Value: 26 },
  ),
  q('BD', 'Etkilendiyse etkisi zararı ne oldu? ', ['Etkisi zararı ne oldu', 'Etkilendiyse etkisi zararı ne oldu'], {
    row1Kind: 'decimal',
    row1Value: 26.1,
    kind: 'joinMulti',
  }),
  col('BE', 'decimalEmpty', 'Hangi olumsuz hava koşulları etkiledi', {
    type: 'joinMulti',
    match: { question: 'Hangi olumsuz hava koşulları etkiledi', exclude: ['açıklayınız', 'aciklayiniz'] },
  }),
  q('BF', 'Olumsuz hava koşullarını açıklayınız.', 'Olumsuz hava koşullarını açıklayınız', {
    row1Kind: 'int',
    row1Value: 26.2,
  }),
  q('BG', 'H&Z ile ilgili herhangi bir biyolojik mücadeleniz var mı?', 'H&Z ile ilgili herhangi bir biyolojik mücadeleniz var mı', {
    row1Kind: 'int',
    row1Value: 27,
  }),
  q('BH', 'Gübre kullanıyor mu?', 'Gübre kullanıyor mu', { row1Kind: 'int', row1Value: 28 }),
  q('BI', 'Gübreyi belirleme şekli?', 'Gübreyi belirleme şekli', {
    row1Kind: 'decimal',
    row1Value: 28.1,
    kind: 'joinMulti',
  }),
  col('BJ', 'decimalEmpty', 'Kullanıyorsa gübre çeşidi?', {
    type: 'joinMulti',
    match: { question: ['Kullanılan gübre çeşidi', 'Kullanıyorsa gübre çeşidi'] },
  }),
  q('BK', '%26 NİTRAT  kullanım miktarı? (da/kg)', '%26 NİTRAT  kullanım miktarı', {
    row1Kind: 'decimal',
    row1Value: 28.2,
  }),
  col('BL', 'decimalEmpty', '10-20-20 kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: '10-20-20 kullanım miktarı' },
  }),
  col('BM', 'decimalEmpty', '13-24-12 kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: '13-24-12 kullanım miktarı' },
  }),
  col('BN', 'decimalEmpty', '15-15-15 kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: '15-15-15 kullanım miktarı' },
  }),
  col('BO', 'decimalEmpty', '20-20 kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: '20-20 kullanım miktarı' },
  }),
  col('BP', 'decimalEmpty', 'Amonyum Nitrat %33N kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: 'Amonyum Nitrat %33N kullanım miktarı' },
  }),
  col('BQ', 'decimalEmpty', 'Büyükbaş Hayvan Gübesi kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: ['Büyükbaş hayvan gübresi kullanım miktarı', 'Büyükbaş Hayvan Gübesi kullanım miktarı'] },
  }),
  col('BR', 'decimalEmpty', 'DAP (18-46-0) kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: ['DAP (18-46-0) kullanım miktarı', 'Dap (18-46-0) kullanım miktarı'] },
  }),
  col('BS', 'decimalEmpty', 'Gübre çeşidini açıklayınız.', {
    type: 'question',
    match: { question: 'Gübre çeşidini açıklayınız' },
  }),
  col('BT', 'decimalEmpty', 'Küçükbaş Hayvan Gübesi kullanım miktarı? (da/kg\r\n)', {
    type: 'question',
    match: { question: ['Küçükbaş Hayvan Gübresi kullanım miktarı', 'Küçükbaş Hayvan Gübesi kullanım miktarı'] },
  }),
  col('BU', 'decimalEmpty', 'Kükürt kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: 'Kükürt kullanım miktarı' },
  }),
  col('BV', 'decimalEmpty', 'Potasyum Sülfat kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: 'Potasyum Sülfat kullanım miktarı' },
  }),
  col('BW', 'decimalEmpty', 'TSP %42P kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: 'TSP %42P kullanım miktarı' },
  }),
  col('BX', 'decimalEmpty', 'ÜRE %42N kullanım miktarı? (da/kg)', {
    type: 'question',
    match: { question: ['ÜRE %42N kullanım miktarı', 'Üre %42N kullanım miktarı'] },
  }),

  col(
    'BY',
    'int',
    'Üretici yaşam koşulları (Ev) ( Bireylerin bu koşullara erişme imkanı var mı?)',
    { type: 'joinYesOptions', parent: { question: 'Üretici yaşam koşulları', exclude: ['tarla', 'kırım', 'kirim'] } },
    { row1Value: 29 },
  ),
  q('BZ', 'Üretici kırım süresi boyunca nerede konaklıyor?', 'Üretici kırım süresi boyunca nerede konaklıyor', {
    row1Kind: 'int',
    row1Value: 30,
  }),
  col(
    'CA',
    'int',
    'Günlük kırım süresinde tarlada ki yaşam koşulları?',
    { type: 'joinYesOptions', parent: { question: 'Günlük kırım süresinde tarlada ki yaşam koşulları' } },
    { row1Value: 30.1 },
  ),
  col(
    'CB',
    'int',
    'Üretici yaşam koşulları (Tarla) ( Bireylerin bu koşullara erişme imkanı var mı?)',
    { type: 'joinYesOptions', parent: { question: 'Üretici yaşam koşulları (Tarla)' } },
    { row1Value: 31 },
  ),
  q(
    'CC',
    'Üretici tarlada münavebe yapıyor mu? (Tarlada 1 yıllık ara ile ürün değişimi yapıyor mu?)',
    'Üretici tarlada münavebe yapıyor mu',
    { row1Kind: 'int', row1Value: 32 },
  ),
  q('CD', 'Bir önceki ürün nedir?', 'Bir önceki ürün nedir', { row1Kind: 'int', row1Value: 32.1, kind: 'joinMulti' }),
  q('CE', 'Bir önceki ürünü açıklayınız.', 'Bir önceki ürünü açıklayınız', { row1Kind: 'int', row1Value: 32.2 }),
  q(
    'CF',
    'Tarlanın genel yapısı ? (Genel ne ise o işaretlenecek)',
    'Tarlanın genel yapısı',
    { row1Kind: 'int', row1Value: 33, kind: 'joinMulti' },
  ),
  q('CG', 'Erozyon riski var mı?', 'Erozyon riski var mı', { row1Kind: 'int', row1Value: 34 }),
  q('CH', 'Önleyici çalışmalar nelerdir?', 'Önleyici çalışmalar nelerdir', {
    row1Kind: 'int',
    row1Value: 34.1,
    kind: 'joinMulti',
  }),
  q('CI', 'Hayvancılık yapıyor mu?', 'Hayvancılık yapıyor mu', { row1Kind: 'int', row1Value: 35 }),
  q('CJ', 'Yapılan hayvancılık türü?', 'Yapılan hayvancılık türü', {
    row1Kind: 'int',
    row1Value: 35.1,
    kind: 'joinMulti',
  }),
  q('CK', 'Büyükbaş hayvan sayısı?', 'Büyükbaş hayvan sayısı', { row1Kind: 'decimal', row1Value: 35.2 }),
  col('CL', 'decimalEmpty', 'Küçükbaş hayvan sayısı', {
    type: 'question',
    match: { question: 'Küçükbaş hayvan sayısı' },
  }),
  q('CM', 'Tarlada dikim harici sulama yapıyor mu?', 'Tarlada dikim harici sulama yapıyor mu', {
    row1Kind: 'int',
    row1Value: 36,
  }),
  q('CN', 'Sulama şekli ?', 'Sulama şekli', { row1Kind: 'int', row1Value: 36.1, kind: 'joinMulti' }),
  q('CO', 'Fidelik su kaynağı nedir?', 'Fidelik su kaynağı nedir', { row1Kind: 'int', row1Value: 37, kind: 'joinMulti' }),
  q('CP', 'Tarla su kaynağı nedir?', 'Tarla su kaynağı nedir', { row1Kind: 'int', row1Value: 38, kind: 'joinMulti' }),
  q('CQ', 'Üretici kurutma için sera kullanıyor mu?', 'Üretici kurutma için sera kullanıyor mu', {
    row1Kind: 'int',
    row1Value: 39,
  }),
  q('CR', 'Serada kullanılan naylon rengi? ', 'Serada kullanılan naylon rengi', { row1Kind: 'int', row1Value: 39.1 }),
  q(
    'CS',
    'Boş zirai ilaç atık ambalajlarının imha yöntemi?',
    'Boş zirai ilaç atık ambalajlarının imha yöntemi',
    { row1Kind: 'int', row1Value: 40, kind: 'joinMulti' },
  ),
  q('CT', 'Yevmiyeli işçi, kendi çocuğunu tarlaya getiriyor mu? ', 'Yevmiyeli işçi, kendi çocuğunu tarlaya getiriyor mu', {
    row1Kind: 'int',
    row1Value: 41,
    exclude: ['18 yaş', '18 yas'],
  }),
  q('CU', 'Sezonda kullanılan yakıt türü?', 'Sezonda kullanılan yakıt türü', {
    row1Kind: 'int',
    row1Value: 42,
    kind: 'joinMulti',
  }),
  q('CV', 'Benzin miktarı?  (Miktar bilinmiyor ise toplam bedel?)', 'Benzin miktarı', {
    row1Kind: 'decimal',
    row1Value: 42.1,
  }),
  col('CW', 'decimalEmpty', 'Motorin miktarı? (Miktar bilinmiyor ise toplam bedel?)', {
    type: 'question',
    match: { question: 'Motorin miktarı' },
  }),
]

export const ANKET_CEVAPLARI_EXCEL_COLUMNS: AnketCevapExcelColumn[] = EXCEL_COLUMN_DEFS.map(
  (column, index) => ({ ...column, letter: excelColumnLetter(index) }),
)

export const EXCEL_SOURCE_FIELDS_WITHOUT_TARGET = [
  '10.Bireyin cinsiyeti?',
  '10.Bireyin doğum tarihi?',
  'Yıllık eğitim alan işçi sayısı?',
  'Yevmiyeli işçi, 18 yaşından küçük kendi çocuğunu tarlaya getiriyor mu?',
  'Üretici,18 yaşından küçük kendi çocuğunu tarlaya getiriyor mu?',
  'Hangi işler ile ilgileniyor?',
  'Üretim yapılan tarla/tarlaların 5 yıl önceki durumu?',
  '12-61-0 kullanım miktarı? (da/kg)',
  'Genel olarak sulama ile ilgili bir sıkıntı var mı? (Fidelik,Tarla)',
] as const

export const EXCEL_TARGET_FIELDS_WITHOUT_SOURCE = [
  'AT İşçi konaklama koşulları — uygulamada ayrı konaklama/erişim sorusu yok',
  'AV Tarlaya işçi taşıma yöntemini açıklayınız — uygulamada bu açıklama sorusu yok',
  'BF Olumsuz hava koşullarını açıklayınız — uygulamada bu açıklama sorusu yok',
  'CB Üretici yaşam koşulları (Tarla) — kırım süresi tarla koşullarından (CA) ayrı bir soru yok',
  'CT Yevmiyeli işçi, kendi çocuğunu tarlaya getiriyor mu? — sistemdeki soru 18 yaş sınırı içeriyor, eşdeğer değil',
] as const
