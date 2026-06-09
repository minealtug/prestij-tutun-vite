import type { UserDto } from '../types/user.types'

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

export function mapUserFromApi(raw: unknown): UserDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  if (!Number.isFinite(id)) return null

  return {
    id,
    userName: String(pick(row, 'userName', 'UserName') ?? ''),
    fullName: String(pick(row, 'fullName', 'FullName') ?? ''),
    userTypeDescription: pick(row, 'userTypeDescription', 'UserTypeDescription') ?? null,
    admin: Boolean(pick(row, 'admin', 'Admin')),
    aktif: Boolean(pick(row, 'aktif', 'Aktif')),
    lokasyon: pick(row, 'lokasyon', 'Lokasyon') ?? null,
    departmanId: (() => {
      const raw = pick(row, 'departmanId', 'DepartmanId')
      const num = Number(raw)
      return Number.isFinite(num) && num > 0 ? num : null
    })(),
    departmanAdi: pick(row, 'departmanAdi', 'DepartmanAdi') ?? null,
    mintikaAdi: pick(row, 'mintikaAdi', 'MintikaAdi') ?? null,
    uretimMerkeziYetki: Boolean(pick(row, 'uretimMerkeziYetki', 'UretimMerkeziYetki')),
    email: pick(row, 'email', 'Email') ?? null,
    tel: pick(row, 'tel', 'Tel') ?? null,
  }
}

export function mapUsersFromApi(raw: unknown): UserDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapUserFromApi).filter((item): item is UserDto => item !== null)
}
