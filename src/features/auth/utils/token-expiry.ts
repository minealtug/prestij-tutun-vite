import { isDevAuthEnabled } from '../dev/dev-auth'

function decodeJwtExpiryMs(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { exp?: unknown }
    const exp = Number(payload.exp)
    return Number.isFinite(exp) && exp > 0 ? exp * 1000 : null
  } catch {
    return null
  }
}

export function resolveTokenExpiryMs(
  token: string,
  expiresAtMs: number | null | undefined,
): number | null {
  return decodeJwtExpiryMs(token) ?? expiresAtMs ?? null
}

export function isTokenExpired(
  token: string | null,
  expiresAtMs: number | null | undefined,
): boolean {
  if (!token) return true

  if (token === 'dev-temporary-token' && isDevAuthEnabled()) {
    if (!expiresAtMs) return false
    return Date.now() >= expiresAtMs
  }

  const expiryMs = resolveTokenExpiryMs(token, expiresAtMs)
  if (!expiryMs) return true

  return Date.now() >= expiryMs
}

export function parseApiExpiresAtMs(
  raw: unknown,
  expiresInSeconds?: number,
): number | null {
  if (raw !== undefined && raw !== null && raw !== '') {
    const parsed = new Date(String(raw))
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime()
    }
  }

  if (expiresInSeconds && expiresInSeconds > 0) {
    return Date.now() + expiresInSeconds * 1000
  }

  return null
}
