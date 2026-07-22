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

export const ROW_HEADERS = ['Menşei', 'Bölge', 'Mıntıka', 'Akım Noktası'] as const

export const AGE_RANGES = ['18-30', '31-40', '41-50', '50 Yaş Üstü'] as const

export const SOURCE_GROUPS = [
  { key: 'soz', label: 'Sözleşmeli Ekici', totalLabel: 'Söz. Ekici Toplam' },
  { key: 'yp', label: 'YP Güncel', totalLabel: 'YP Güncel Toplam' },
] as const

export const GROUP_COL_COUNT = AGE_RANGES.length * 3 + 1
export const DATA_COL_COUNT = SOURCE_GROUPS.length * GROUP_COL_COUNT
export const TOTAL_COL_COUNT = ROW_HEADERS.length + DATA_COL_COUNT

export interface HamVeriPivotCell {
  erkek: number
  kadin: number
}

export interface HamVeriPivotRow {
  mensei: string
  bolge: string
  mintika: string
  akimNoktasi: string
  /** Anahtar: `${groupKey}__${range}` — bkz. cellKey() */
  cells: Record<string, HamVeriPivotCell>
}

export function cellKey(groupKey: string, range: string): string {
  return `${groupKey}__${range}`
}
