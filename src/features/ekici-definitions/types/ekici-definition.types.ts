export interface EkiciDefinitionDto {
  id: string
  yil: number
  tcKimlikNo: string
  menseiId: number
  bolgeId: number
  mintikaId: number
  alimNoktasiId: number
  koyId: number
  menseiAdi: string | null
  bolgeAdi: string | null
  mintikaAdi: string | null
  alimNoktasiAdi: string | null
  koyAdi: string | null
  ozKontNo: number
  ad: string
  soyad: string
  babaAdi: string
  anaAdi: string | null
  dogumYeri: string | null
  dogumTarihi: string
  cinsiyet: string | null
  icralik: boolean
  ekiciDurumId: number
  ekiciDurumAdi: string | null
  aktif: number
  makineKodu: string
  uretimMerkeziId: number
  temlik: boolean | null
  sozlesmeIptal: boolean | null
  kaynak: 'AppDb' | 'LegacyDb' | string
}

export interface EkiciDefinitionFormValues {
  yil: number
  tcKimlikNo: string
  menseiId: number
  bolgeId: number
  mintikaId: number
  alimNoktasiId: number
  koyId: number
  ozKontNo: number
  ad: string
  soyad: string
  babaAdi: string
  anaAdi: string
  dogumYeri: string
  dogumTarihi: string
  cinsiyet: string
  icralik: boolean
  ekiciDurumId: number
  aktif: number
  makineKodu: string
  uretimMerkeziId: number
  temlik: boolean
  sozlesmeIptal: boolean
}

export type CreateEkiciDefinitionRequest = EkiciDefinitionFormValues
export type UpdateEkiciDefinitionRequest = EkiciDefinitionFormValues
