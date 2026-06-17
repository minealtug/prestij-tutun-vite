import type { AuthMeResponse, AuthUserDto, LoginResponse } from '../types/auth.types'
import { mapAllowedMenuUrlsFromApi } from '@/features/permissions/utils/permission-logic'
import { parseApiExpiresAtMs } from './token-expiry'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function readNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

export function mapYetkiIdsFromApi(raw: unknown): number[] {
  const list = Array.isArray(raw) ? raw : []
  return [...new Set(list.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
}

function mapAuthUser(userRaw: Record<string, unknown>, fallbackUserName = ''): AuthUserDto {
  const userName = String(
    pick(userRaw, 'userName', 'UserName') ?? fallbackUserName ?? '',
  )
  const idRaw = pick(userRaw, 'id', 'Id', 'userId', 'UserId')
  const fullName = String(
    pick(userRaw, 'fullName', 'FullName', 'adSoyad', 'AdSoyad') ?? userName ?? 'Kullanıcı',
  )

  return {
    id: String(idRaw ?? userName ?? 'user'),
    userName,
    email: pick(userRaw, 'email', 'Email'),
    fullName,
    role: pick(userRaw, 'role', 'Role'),
    admin: Boolean(pick(userRaw, 'admin', 'Admin') ?? false),
    departmanId: readNumber(pick(userRaw, 'departmanId', 'DepartmanId')),
    departmanAdi: pick(userRaw, 'departmanAdi', 'DepartmanAdi') ?? null,
    mintikaId: readNumber(pick(userRaw, 'mintikaId', 'MintikaId')),
  }
}

export function normalizeLoginResponse(raw: unknown): LoginResponse {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const nestedUser = pick<Record<string, unknown>>(row, 'user', 'User')
  const userRaw = nestedUser ?? row

  const accessToken = String(
    pick(row, 'accessToken', 'AccessToken', 'token', 'Token') ?? '',
  )
  const expiresIn = pick<number>(row, 'expiresIn', 'ExpiresIn')
  const expiresAtRaw = pick(row, 'expiresAt', 'ExpiresAt')

  return {
    accessToken,
    expiresIn,
    expiresAt: expiresAtRaw !== undefined ? String(expiresAtRaw) : undefined,
    user: mapAuthUser(userRaw, String(pick(row, 'userName', 'UserName') ?? '')),
  }
}

export function getLoginExpiresAtMs(response: LoginResponse): number | null {
  return parseApiExpiresAtMs(response.expiresAt, response.expiresIn)
}

export function normalizeAuthMeResponse(raw: unknown): AuthMeResponse {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const userRaw = pick<Record<string, unknown>>(row, 'user', 'User') ?? {}
  const permissionsRaw = pick<unknown[]>(row, 'permissions', 'Permissions') ?? []
  const yetkiIdsRaw =
    pick<unknown[]>(row, 'yetkiIds', 'YetkiIds', 'yetkiIdler', 'YetkiIdler') ?? []

  return {
    user: {
      id: Number(pick(userRaw, 'id', 'Id') ?? 0),
      userName: String(pick(userRaw, 'userName', 'UserName') ?? ''),
      fullName: String(pick(userRaw, 'fullName', 'FullName') ?? ''),
      email: pick(userRaw, 'email', 'Email'),
      departmanId: readNumber(pick(userRaw, 'departmanId', 'DepartmanId')),
      departmanAdi: pick(userRaw, 'departmanAdi', 'DepartmanAdi') ?? null,
      mintikaId: readNumber(pick(userRaw, 'mintikaId', 'MintikaId')),
      aktif: Boolean(pick(userRaw, 'aktif', 'Aktif') ?? true),
      admin: Boolean(pick(userRaw, 'admin', 'Admin') ?? false),
    },
    permissions: mapAllowedMenuUrlsFromApi(permissionsRaw),
    yetkiIds: mapYetkiIdsFromApi(yetkiIdsRaw),
  }
}

export function mapAuthMeUserToSession(user: AuthMeResponse['user']) {
  return {
    id: String(user.id),
    userName: user.userName,
    fullName: user.fullName,
    email: user.email ?? undefined,
    admin: user.admin,
    departmanId: user.departmanId ?? null,
    departmanAdi: user.departmanAdi ?? null,
    mintikaId: user.mintikaId ?? null,
  }
}
