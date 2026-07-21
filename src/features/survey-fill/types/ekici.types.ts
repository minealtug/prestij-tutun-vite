export interface EkiciDto {
  id: string
  adi: string
  soyad: string
  mintikaId: number | null
  /** 1 = aktif, 0 = pasif */
  aktif: number
  /** AppDb'deki CINSIYET kolonundan gelen değer (ör. Erkek, Kadın); yoksa null */
  cinsiyet: string | null
  dogumTarihi: string | null
}
