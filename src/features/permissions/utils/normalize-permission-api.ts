import type { DepartmanDto, MenuAtamaDto, MenuDto, RolYetkiDto, YetkiDto } from '../types/permission.types'

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

export function mapMenuFromApi(raw: unknown): MenuDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  const yetkiId = Number(pick(row, 'yetkiId', 'YetkiId'))
  if (!Number.isFinite(id) || !Number.isFinite(yetkiId)) return null

  return {
    id,
    yetkiId,
    menuAdi: String(pick(row, 'menuAdi', 'MenuAdi') ?? ''),
    menuUrl: String(pick(row, 'menuUrl', 'MenuUrl') ?? ''),
    yetkiAdi: String(pick(row, 'yetkiAdi', 'YetkiAdi') ?? ''),
  }
}

export function mapMenusFromApi(raw: unknown): MenuDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapMenuFromApi).filter((item): item is MenuDto => item !== null)
}

export function mapYetkiFromApi(raw: unknown): YetkiDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  if (!Number.isFinite(id)) return null

  return {
    id,
    yetkiTuru: String(pick(row, 'yetkiTuru', 'YetkiTuru') ?? ''),
  }
}

export function mapYetkilerFromApi(raw: unknown): YetkiDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapYetkiFromApi).filter((item): item is YetkiDto => item !== null)
}

export function mapDepartmanFromApi(raw: unknown): DepartmanDto | null {
  const row = asRecord(raw)
  const adi = String(pick(row, 'adi', 'Adi') ?? '').trim()
  if (!adi) return null

  const idRaw = pick(row, 'id', 'Id')
  const id = idRaw == null ? null : Number(idRaw)

  return {
    id: Number.isFinite(id) && id! > 0 ? id : null,
    adi,
    aktif: Boolean(pick(row, 'aktif', 'Aktif') ?? true),
    kaynak: pick(row, 'kaynak', 'Kaynak'),
  }
}

export function mapDepartmansFromApi(raw: unknown): DepartmanDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapDepartmanFromApi).filter((item): item is DepartmanDto => item !== null)
}

export function mapRolYetkiFromApi(raw: unknown): RolYetkiDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  const yetkiId = Number(pick(row, 'yetkiId', 'YetkiId'))
  if (!Number.isFinite(id) || !Number.isFinite(yetkiId)) return null

  const departmanIdRaw = pick(row, 'departmanId', 'DepartmanId')
  const userIdRaw = pick(row, 'userId', 'UserId')

  return {
    id,
    yetkiId,
    departmanId:
      departmanIdRaw == null ? null : Number.isFinite(Number(departmanIdRaw)) ? Number(departmanIdRaw) : null,
    departmanAdi: pick(row, 'departmanAdi', 'DepartmanAdi') ?? null,
    userId: userIdRaw == null ? null : Number.isFinite(Number(userIdRaw)) ? Number(userIdRaw) : null,
    yetkiTuru: pick(row, 'yetkiTuru', 'YetkiTuru') ?? null,
    kaynak: pick(row, 'kaynak', 'Kaynak'),
  }
}

export function mapRolYetkilerFromApi(raw: unknown): RolYetkiDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapRolYetkiFromApi).filter((item): item is RolYetkiDto => item !== null)
}

export function mapMenuAtamaFromApi(raw: unknown): MenuAtamaDto | null {
  const row = asRecord(raw)

  const menuIdRaw = pick(row, 'menuId', 'MenuId', 'id', 'Id')
  const yetkiIdRaw = pick(row, 'yetkiId', 'YetkiId')
  const departmanIdRaw = pick(row, 'departmanId', 'DepartmanId')
  const userIdRaw = pick(row, 'userId', 'UserId')

  const menuId =
    menuIdRaw == null ? null : Number.isFinite(Number(menuIdRaw)) ? Number(menuIdRaw) : null
  const yetkiId =
    yetkiIdRaw == null ? null : Number.isFinite(Number(yetkiIdRaw)) ? Number(yetkiIdRaw) : null

  const menuAdi = String(pick(row, 'menuAdi', 'MenuAdi') ?? '').trim()
  const menuUrl = String(pick(row, 'menuUrl', 'MenuUrl') ?? '').trim()
  if (!menuAdi && !menuUrl && !menuId && !yetkiId) return null

  return {
    menuId,
    menuAdi,
    menuUrl,
    yetkiId,
    yetkiTuru: String(pick(row, 'yetkiTuru', 'YetkiTuru') ?? '').trim() || null,
    departmanId:
      departmanIdRaw == null ? null : Number.isFinite(Number(departmanIdRaw)) ? Number(departmanIdRaw) : null,
    departmanAdi: String(pick(row, 'departmanAdi', 'DepartmanAdi') ?? '').trim() || null,
    userId: userIdRaw == null ? null : Number.isFinite(Number(userIdRaw)) ? Number(userIdRaw) : null,
    userAdi:
      String(
        pick(
          row,
          'fullName',
          'FullName',
          'userAdi',
          'UserAdi',
          'kullaniciAdi',
          'KullaniciAdi',
          'adSoyad',
          'AdSoyad',
        ) ?? '',
      ).trim() || null,
  }
}

export function mapMenuAtamalarFromApi(raw: unknown): MenuAtamaDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapMenuAtamaFromApi).filter((item): item is MenuAtamaDto => item !== null)
}
