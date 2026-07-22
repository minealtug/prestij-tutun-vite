import type { AnketCevapRow } from '../types/anket-cevaplari.types'

export interface FixedColumn {
  key: keyof AnketCevapRow
  header: string
}

/** Soru kolonlarından önce gelen sabit ekici/anket kolonları */
export const FIXED_COLUMNS: FixedColumn[] = [
  { key: 'anketAdi', header: 'Anket' },
  { key: 'mensei', header: 'Menşei' },
  { key: 'mintika', header: 'Mıntıka' },
  { key: 'alimNoktasi', header: 'Alım Noktası' },
  { key: 'koy', header: 'Köy' },
  { key: 'tc', header: 'TC' },
  { key: 'adi', header: 'Adı' },
  { key: 'soyadi', header: 'Soyadı' },
  { key: 'dogumTarihi', header: 'Doğum Tarihi' },
  { key: 'cinsiyet', header: 'Cinsiyet' },
  { key: 'ekiciYasAraligi', header: 'Yaş Aralığı' },
  { key: 'uretimiYapan', header: 'Üretimi Yapan' },
  { key: 'sozlesmeKg', header: 'Sözleşme Kg' },
  { key: 'donum', header: 'Dönüm' },
]
