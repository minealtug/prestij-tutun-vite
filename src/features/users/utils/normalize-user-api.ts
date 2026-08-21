import type { MintikaOptionDto, UserDto } from '../types/user.types'
import { formatMintikaAdi, resolveMintikaIds } from './resolve-mintika-ids'

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

  const readOptionalId = (...keys: string[]) => {
    const raw = pick(row, ...keys)
    const num = Number(raw)
    return Number.isFinite(num) && num > 0 ? num : null
  }

  const mintikalar = mapMintikalarFromApi(pick(row, 'mintikalar', 'Mintikalar'))
  const mintikaId = readOptionalId('mintikaId', 'MintikaId')
  const mintikaIds = resolveMintikaIds({
    mintikaIds: pick(row, 'mintikaIds', 'MintikaIds'),
    mintikaId,
    mintikalar,
  })
  const mintikaAdiRaw = pick<string>(row, 'mintikaAdi', 'MintikaAdi')

  return {
    id,
    userName: String(pick(row, 'userName', 'UserName') ?? ''),
    fullName: String(pick(row, 'fullName', 'FullName') ?? ''),
    userTypeId: readOptionalId('userTypeId', 'UserTypeId'),
    userTypeDescription: pick(row, 'userTypeDescription', 'UserTypeDescription') ?? null,
    admin: Boolean(pick(row, 'admin', 'Admin')),
    aktif: Boolean(pick(row, 'aktif', 'Aktif')),
    lokasyon: pick(row, 'lokasyon', 'Lokasyon') ?? null,
    departmanId: readOptionalId('departmanId', 'DepartmanId'),
    departmanAdi: pick(row, 'departmanAdi', 'DepartmanAdi') ?? null,
    mintikaId: mintikaIds[0] ?? mintikaId,
    mintikaIds,
    mintikalar,
    mintikaAdi: formatMintikaAdi(mintikaAdiRaw, mintikalar) || null,
    supervisorUserId: readOptionalId('supervisorUserId', 'SupervisorUserId'),
    insuranceNumber: pick(row, 'insuranceNumber', 'InsuranceNumber') ?? null,
    icraOdemeUyari: Boolean(pick(row, 'icraOdemeUyari', 'IcraOdemeUyari')),
    uretimMerkeziYetki: Boolean(pick(row, 'uretimMerkeziYetki', 'UretimMerkeziYetki')),
    email: pick(row, 'email', 'Email') ?? null,
    tel: pick(row, 'tel', 'Tel') ?? null,
    fotografUrl: pick(row, 'fotografUrl', 'FotografUrl') ?? null,
  }
}

function mapMintikalarFromApi(raw: unknown): MintikaOptionDto[] {
  if (!Array.isArray(raw)) return []
  const items: MintikaOptionDto[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    const row = asRecord(item)
    const id = Number(pick(row, 'id', 'Id'))
    const adi = String(pick(row, 'adi', 'Adi') ?? '').trim()
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue
    seen.add(id)
    items.push({ id, adi })
  }
  return items
}

export function mapUsersFromApi(raw: unknown): UserDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapUserFromApi).filter((item): item is UserDto => item !== null)
}
