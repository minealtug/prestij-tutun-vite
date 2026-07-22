export const TABS = [
  {
    key: 'ekici',
    label: 'Ekici Yaş-Cinsiyet Raporu',
    title: 'Ekici Yaş-Cinsiyet Dağılımları',
  },
  {
    key: 'cocuk',
    label: 'Çocuk Yaş-Cinsiyet Raporu',
    title: 'Çocuk Yaş-Cinsiyet Dağılımları',
  },
  {
    key: 'aile',
    label: 'Aile Bireyi Yaş-Cinsiyet Raporu',
    title: 'Aile Bireyi Yaş-Cinsiyet Dağılımları',
  },
] as const

export type TabKey = (typeof TABS)[number]['key']

export const ROW_HEADERS = ['Menşei', 'Bölge', 'Mıntıka', 'Alım Noktası'] as const

export const AGE_BANDS = [
  { key: 'band18_30', label: '18-30' },
  { key: 'band31_40', label: '31-40' },
  { key: 'band41_50', label: '41-50' },
  { key: 'band50Plus', label: '50 Yaş Üstü' },
] as const

export type AgeBandKey = (typeof AGE_BANDS)[number]['key']

export const SOURCE_LABEL = 'Söz. Ekici'
export const SOURCE_TOTAL_LABEL = 'Söz. Ekici Toplam'

/** Her band için Erkek + Kadın + Toplam = 3 sütun, sonda grup toplamı = +1 */
export const DATA_COL_COUNT = AGE_BANDS.length * 3 + 1
export const TOTAL_COL_COUNT = ROW_HEADERS.length + DATA_COL_COUNT
