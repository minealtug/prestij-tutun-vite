import type { MintikaOptionDto, UserTypeOptionDto } from '../types/user.types'

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

export function mapUserTypeFromApi(raw: unknown): UserTypeOptionDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  if (!Number.isFinite(id)) return null

  return {
    id,
    description: String(pick(row, 'description', 'Description') ?? ''),
    active: Boolean(pick(row, 'active', 'Active') ?? true),
  }
}

export function mapUserTypesFromApi(raw: unknown): UserTypeOptionDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapUserTypeFromApi).filter((item): item is UserTypeOptionDto => item !== null)
}

export function mapDepartmanAdiFromApi(raw: unknown): string | null {
  const row = asRecord(raw)
  const adi = String(pick(row, 'adi', 'Adi') ?? '').trim()
  return adi || null
}

export function mapDepartmanAdlariFromApi(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapDepartmanAdiFromApi)
    .filter((adi): adi is string => adi !== null)
}

export function mapMintikaFromApi(raw: unknown): MintikaOptionDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  if (!Number.isFinite(id)) return null

  return {
    id,
    adi: String(pick(row, 'adi', 'Adi') ?? ''),
  }
}

export function mapMintikasFromApi(raw: unknown): MintikaOptionDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapMintikaFromApi).filter((item): item is MintikaOptionDto => item !== null)
}
