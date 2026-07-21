import type { EkiciDto } from '../types/ekici.types'
import { toDateInputValue } from './date-input-value'

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

function readNumber(raw: unknown): number | null {
  const num = Number(raw)
  return Number.isFinite(num) && num > 0 ? num : null
}

function readAktif(raw: unknown): number {
  const num = Number(raw)
  return Number.isFinite(num) ? num : 1
}

function readOptionalText(raw: unknown): string | null {
  const text = String(raw ?? '').trim()
  return text || null
}

function readDogumTarihi(raw: unknown): string | null {
  const normalized = toDateInputValue(raw == null ? null : String(raw))
  if (!normalized) return null
  const year = Number(normalized.slice(0, 4))
  if (!Number.isFinite(year) || year < 1900) return null
  return normalized
}

export function isEkiciActive(ekici: Pick<EkiciDto, 'aktif'>): boolean {
  return ekici.aktif === 1
}

export function getEkiciFullName(ekici: Pick<EkiciDto, 'adi' | 'soyad'>): string {
  return [ekici.adi, ekici.soyad].filter(Boolean).join(' ').trim() || '—'
}

export function mapEkiciFromApi(raw: unknown): EkiciDto | null {
  const row = asRecord(raw)
  const id = String(pick(row, 'id', 'Id') ?? '').trim()
  if (!id) return null

  return {
    id,
    adi: String(pick(row, 'adi', 'Adi', 'ad', 'Ad') ?? '').trim(),
    soyad: String(pick(row, 'soyad', 'Soyad') ?? '').trim(),
    mintikaId: readNumber(pick(row, 'mintikaId', 'MintikaId')),
    aktif: readAktif(pick(row, 'aktif', 'Aktif')),
    cinsiyet: readOptionalText(pick(row, 'cinsiyet', 'Cinsiyet')),
    dogumTarihi: readDogumTarihi(pick(row, 'dogumTarihi', 'DogumTarihi')),
  }
}

export function mapEkicilerFromApi(raw: unknown): EkiciDto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapEkiciFromApi)
    .filter((item): item is EkiciDto => item !== null)
    .sort((a, b) => getEkiciFullName(a).localeCompare(getEkiciFullName(b), 'tr-TR'))
}
