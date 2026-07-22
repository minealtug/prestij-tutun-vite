export interface AnketCevapRow {
  rowKey: string
  ekiciId: string
  baslikId: number
  sablonId: number
  anketAdi: string
  mensei: string
  mintika: string
  alimNoktasi: string
  koy: string
  tc: string
  adi: string
  soyadi: string
  dogumTarihi: string
  sozlesmeKg: number
  donum: number
  cinsiyet: string
  ekiciYasAraligi: string
  uretimiYapan: string
  cevaplar: string[]
}

export interface AnketCevaplariReport {
  soruKolonlari: string[]
  satirlar: AnketCevapRow[]
}

export interface AnketCevaplariQueryParams {
  baslikId?: number
  menseiId?: number
  bolgeId?: number
  mintikaId?: number
  alimNoktasiId?: number
  koyId?: number
}
