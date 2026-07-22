export interface BandDef {
  key: string
  label: string
}

export interface YasCinsiyetTabConfig {
  key: TabKey
  label: string
  title: string
  /** API endpoint — tanımsızsa rapor henüz hazır değil demektir */
  endpoint?: string
  bands: BandDef[]
  sourceLabel: string
  totalLabel: string
  /** genelToplam / counts / totals içindeki grup toplamı alan adı */
  totalKey: string
}

export type TabKey = 'ekici' | 'cocuk' | 'aile'

export const ROW_HEADERS = ['Menşei', 'Bölge', 'Mıntıka', 'Alım Noktası'] as const

export const TABS: YasCinsiyetTabConfig[] = [
  {
    key: 'ekici',
    label: 'Ekici Yaş-Cinsiyet Raporu',
    title: 'Ekici Yaş-Cinsiyet Dağılımları',
    endpoint: '/api/Rapor/ekici-yas-cinsiyet',
    bands: [
      { key: 'band18_30', label: '18-30' },
      { key: 'band31_40', label: '31-40' },
      { key: 'band41_50', label: '41-50' },
      { key: 'band50Plus', label: '50 Yaş Üstü' },
    ],
    sourceLabel: 'Söz. Ekici',
    totalLabel: 'Söz. Ekici Toplam',
    totalKey: 'sozlesmeliEkiciToplam',
  },
  {
    key: 'cocuk',
    label: 'Çocuk Yaş-Cinsiyet Raporu',
    title: 'Çocuk Yaş-Cinsiyet Dağılımları',
    endpoint: '/api/Rapor/cocuk-yas-cinsiyet',
    bands: [
      { key: 'bandUnder12', label: '12 Yaş Altı' },
      { key: 'band12_14', label: '12-14' },
      { key: 'band15_17', label: '15-17' },
    ],
    sourceLabel: 'Çocuk',
    totalLabel: 'Birey Toplam',
    totalKey: 'bireyToplam',
  },
  {
    key: 'aile',
    label: 'Aile Bireyi Yaş-Cinsiyet Raporu',
    title: 'Aile Bireyi Yaş-Cinsiyet Dağılımları',
    endpoint: undefined,
    bands: [
      { key: 'band18_30', label: '18-30' },
      { key: 'band31_40', label: '31-40' },
      { key: 'band41_50', label: '41-50' },
      { key: 'band50Plus', label: '50 Yaş Üstü' },
    ],
    sourceLabel: 'Aile Bireyi',
    totalLabel: 'Birey Toplam',
    totalKey: 'bireyToplam',
  },
]

export function dataColCount(tab: YasCinsiyetTabConfig): number {
  return tab.bands.length * 3 + 1
}

export function totalColCount(tab: YasCinsiyetTabConfig): number {
  return ROW_HEADERS.length + dataColCount(tab)
}
