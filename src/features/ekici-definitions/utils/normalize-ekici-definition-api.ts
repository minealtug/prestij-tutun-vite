import type {
  EkiciDefinitionDto,
  EkiciDefinitionFormValues,
} from '../types/ekici-definition.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function readNumber(raw: unknown, fallback = 0): number {
  const num = Number(raw)
  return Number.isFinite(num) ? num : fallback
}

function readString(raw: unknown): string {
  return raw != null ? String(raw).trim() : ''
}

function readBool(raw: unknown, fallback = false): boolean {
  if (typeof raw === 'boolean') return raw
  if (raw === 1 || raw === '1' || raw === 'true') return true
  if (raw === 0 || raw === '0' || raw === 'false') return false
  return fallback
}

function readNullableBool(raw: unknown): boolean | null {
  if (raw === null || raw === undefined) return null
  return readBool(raw)
}

function readDateInput(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const text = String(raw)
  if (text.length >= 10 && text.includes('T')) return text.slice(0, 10)
  return text.slice(0, 10)
}

function readNullableString(raw: unknown): string | null {
  const text = readString(raw)
  return text.length > 0 ? text : null
}

export function getEkiciFullName(ekici: Pick<EkiciDefinitionDto, 'ad' | 'soyad'>): string {
  return [ekici.ad, ekici.soyad].filter(Boolean).join(' ').trim() || '—'
}

export function mapEkiciDefinitionFromApi(raw: unknown): EkiciDefinitionDto | null {
  const row = asRecord(raw)
  const id = readString(pick(row, 'id', 'Id'))
  if (!id) return null

  return {
    id,
    yil: readNumber(pick(row, 'yil', 'Yil')),
    tcKimlikNo: readString(pick(row, 'tcKimlikNo', 'TcKimlikNo')),
    menseiId: readNumber(pick(row, 'menseiId', 'MenseiId')),
    bolgeId: readNumber(pick(row, 'bolgeId', 'BolgeId')),
    mintikaId: readNumber(pick(row, 'mintikaId', 'MintikaId')),
    alimNoktasiId: readNumber(pick(row, 'alimNoktasiId', 'AlimNoktasiId')),
    koyId: readNumber(pick(row, 'koyId', 'KoyId')),
    menseiAdi: readNullableString(pick(row, 'menseiAdi', 'MenseiAdi')),
    bolgeAdi: readNullableString(pick(row, 'bolgeAdi', 'BolgeAdi')),
    mintikaAdi: readNullableString(pick(row, 'mintikaAdi', 'MintikaAdi')),
    alimNoktasiAdi: readNullableString(pick(row, 'alimNoktasiAdi', 'AlimNoktasiAdi')),
    koyAdi: readNullableString(pick(row, 'koyAdi', 'KoyAdi')),
    ozKontNo: readNumber(pick(row, 'ozKontNo', 'OzKontNo')),
    ad: readString(pick(row, 'ad', 'Ad')),
    soyad: readString(pick(row, 'soyad', 'Soyad')),
    babaAdi: readString(pick(row, 'babaAdi', 'BabaAdi')),
    anaAdi: readString(pick(row, 'anaAdi', 'AnaAdi')) || null,
    dogumYeri: readString(pick(row, 'dogumYeri', 'DogumYeri')) || null,
    dogumTarihi: readDateInput(pick(row, 'dogumTarihi', 'DogumTarihi')),
    cinsiyet: readNullableString(pick(row, 'cinsiyet', 'Cinsiyet')),
    icralik: readBool(pick(row, 'icralik', 'Icralik')),
    ekiciDurumId: readNumber(pick(row, 'ekiciDurumId', 'EkiciDurumId'), 1),
    ekiciDurumAdi: readNullableString(pick(row, 'ekiciDurumAdi', 'EkiciDurumAdi')),
    aktif: readNumber(pick(row, 'aktif', 'Aktif'), 1),
    makineKodu: readString(pick(row, 'makineKodu', 'MakineKodu')) || '000',
    uretimMerkeziId: readNumber(pick(row, 'uretimMerkeziId', 'UretimMerkeziId')),
    temlik: readNullableBool(pick(row, 'temlik', 'Temlik')),
    sozlesmeIptal: readNullableBool(pick(row, 'sozlesmeIptal', 'SozlesmeIptal')),
    kaynak: readString(pick(row, 'kaynak', 'Kaynak')) || 'LegacyDb',
  }
}

export function mapEkiciDefinitionsFromApi(raw: unknown): EkiciDefinitionDto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapEkiciDefinitionFromApi)
    .filter((item): item is EkiciDefinitionDto => item !== null)
    .sort((a, b) => getEkiciFullName(a).localeCompare(getEkiciFullName(b), 'tr-TR'))
}

export function toEkiciDefinitionPayload(values: EkiciDefinitionFormValues) {
  return {
    yil: values.yil,
    tcKimlikNo: values.tcKimlikNo.trim(),
    menseiId: values.menseiId,
    bolgeId: values.bolgeId,
    mintikaId: values.mintikaId,
    alimNoktasiId: values.alimNoktasiId,
    koyId: values.koyId,
    ozKontNo: values.ozKontNo,
    ad: values.ad.trim(),
    soyad: values.soyad.trim(),
    babaAdi: values.babaAdi.trim(),
    anaAdi: values.anaAdi.trim() || null,
    dogumYeri: values.dogumYeri.trim() || null,
    dogumTarihi: values.dogumTarihi,
    cinsiyet: values.cinsiyet.trim() || null,
    icralik: values.icralik,
    ekiciDurumId: values.ekiciDurumId,
    aktif: values.aktif,
    makineKodu: values.makineKodu.trim(),
    uretimMerkeziId: values.uretimMerkeziId,
    temlik: values.temlik,
    sozlesmeIptal: values.sozlesmeIptal,
  }
}

export function createEmptyEkiciFormValues(): EkiciDefinitionFormValues {
  return {
    yil: new Date().getFullYear(),
    tcKimlikNo: '',
    menseiId: 0,
    bolgeId: 0,
    mintikaId: 0,
    alimNoktasiId: 0,
    koyId: 0,
    ozKontNo: 0,
    ad: '',
    soyad: '',
    babaAdi: '',
    anaAdi: '',
    dogumYeri: '',
    dogumTarihi: '',
    cinsiyet: '',
    icralik: false,
    ekiciDurumId: 1,
    aktif: 1,
    makineKodu: '000',
    uretimMerkeziId: 0,
    temlik: false,
    sozlesmeIptal: false,
  }
}

export function ekiciDefinitionToFormValues(ekici: EkiciDefinitionDto): EkiciDefinitionFormValues {
  return {
    yil: ekici.yil,
    tcKimlikNo: ekici.tcKimlikNo,
    menseiId: ekici.menseiId,
    bolgeId: ekici.bolgeId,
    mintikaId: ekici.mintikaId,
    alimNoktasiId: ekici.alimNoktasiId,
    koyId: ekici.koyId,
    ozKontNo: ekici.ozKontNo,
    ad: ekici.ad,
    soyad: ekici.soyad,
    babaAdi: ekici.babaAdi,
    anaAdi: ekici.anaAdi ?? '',
    dogumYeri: ekici.dogumYeri ?? '',
    dogumTarihi: ekici.dogumTarihi,
    cinsiyet: ekici.cinsiyet ?? '',
    icralik: ekici.icralik,
    ekiciDurumId: ekici.ekiciDurumId,
    aktif: ekici.aktif,
    makineKodu: ekici.makineKodu,
    uretimMerkeziId: ekici.uretimMerkeziId,
    temlik: ekici.temlik ?? false,
    sozlesmeIptal: ekici.sozlesmeIptal ?? false,
  }
}
