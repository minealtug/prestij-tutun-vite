export interface AgeBandValue {
  erkek: number
  kadin: number
  toplam: number
}

/** Bir düğümün (menşei/bölge/mıntıka/alım noktası veya genel) yaş-cinsiyet toplamları */
export interface EkiciYasCinsiyetTotals {
  band18_30: AgeBandValue
  band31_40: AgeBandValue
  band41_50: AgeBandValue
  band50Plus: AgeBandValue
  sozlesmeliEkiciToplam: number
}

/** Tabloda gösterilen tek satır (alım noktası kırılımı) */
export interface EkiciYasCinsiyetRow extends EkiciYasCinsiyetTotals {
  menseiAd: string
  bolgeAd: string
  mintikaAd: string
  alimNoktasiAd: string
}

/** Normalize edilmiş rapor modeli */
export interface EkiciYasCinsiyetReport {
  rows: EkiciYasCinsiyetRow[]
  genelToplam: EkiciYasCinsiyetTotals
}

export interface EkiciYasCinsiyetQueryParams {
  baslikId?: number
  menseiId?: number
  bolgeId?: number
  mintikaId?: number
  alimNoktasiId?: number
  koyId?: number
}
