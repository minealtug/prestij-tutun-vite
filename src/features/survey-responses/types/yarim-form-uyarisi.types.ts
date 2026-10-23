export interface YarimFormUyarisiKayit {
  id: string
  ekiciId: string
  ekiciAd: string
  ekiciSoyad: string
  kullaniciAdi: string
  anketAdi: string
  mintikaAdi: string
  baslikId?: number
  sablonId: number
  sonIslemTarihi: string
  beklemeGunu: number | null
  yanitlananSoruSayisi: number
  yanitlanmayanSoruSayisi: number
  eksikSorular: string[]
  eskiyen: boolean
}

export interface YarimFormUyarisi {
  adet: number
  kayitlar: YarimFormUyarisiKayit[]
}
