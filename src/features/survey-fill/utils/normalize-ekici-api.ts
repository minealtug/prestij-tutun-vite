import type { EkiciDto } from '../types/ekici.types'

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

export function getEkiciFullName(ekici: Pick<EkiciDto, 'adi' | 'soyad'>): string {
  return [ekici.adi, ekici.soyad].filter(Boolean).join(' ').trim() || '—'
}

export function mapEkiciFromApi(raw: unknown): EkiciDto | null {
  const row = asRecord(raw)
  const id = String(pick(row, 'id', 'Id') ?? '').trim()
  if (!id) return null

  return {
    id,
    adi: String(pick(row, 'adi', 'Adi') ?? '').trim(),
    soyad: String(pick(row, 'soyad', 'Soyad') ?? '').trim(),
    mintikaId: readNumber(pick(row, 'mintikaId', 'MintikaId')),
  }
}

export function mapEkicilerFromApi(raw: unknown): EkiciDto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapEkiciFromApi)
    .filter((item): item is EkiciDto => item !== null)
    .sort((a, b) => getEkiciFullName(a).localeCompare(getEkiciFullName(b), 'tr-TR'))
}
