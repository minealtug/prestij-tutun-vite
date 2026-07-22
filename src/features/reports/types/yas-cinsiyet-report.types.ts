export interface BandValue {
  erkek: number
  kadin: number
  toplam: number
}

export interface YasCinsiyetTotals {
  /** Band anahtarına göre değerler (ör. band18_30, bandUnder12) */
  bands: Record<string, BandValue>
  /** Grup toplamı (sozlesmeliEkiciToplam / bireyToplam …) */
  grupToplam: number
}

export interface YasCinsiyetRow extends YasCinsiyetTotals {
  menseiAd: string
  bolgeAd: string
  mintikaAd: string
  alimNoktasiAd: string
}

export interface YasCinsiyetReport {
  rows: YasCinsiyetRow[]
  genelToplam: YasCinsiyetTotals
}

export interface YasCinsiyetQueryParams {
  baslikId?: number
  menseiId?: number
  bolgeId?: number
  mintikaId?: number
  alimNoktasiId?: number
  koyId?: number
}
