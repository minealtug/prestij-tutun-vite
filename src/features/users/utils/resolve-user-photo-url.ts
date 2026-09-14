function appendCacheKey(url: string, cacheKey?: string | number | null): string {
  if (cacheKey == null || cacheKey === '') return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(String(cacheKey))}`
}

function extractUserIdFromStoredUrl(value: string): string | null {
  const match = value.replace(/\\/g, '/').match(/uploads\/users\/(\d+)\.[a-z0-9]+(?:\?.*)?$/i)
  return match?.[1] ?? null
}

export function resolveUserPhotoUrl(
  fotografUrl: string | null | undefined,
  cacheKey?: string | number | null,
  userId?: string | number | null,
): string | null {
  const value = fotografUrl?.trim()
  if (!value) return null

  if (value.startsWith('blob:') || value.startsWith('data:')) {
    return value
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const resolvedUserId = userId ?? extractUserIdFromStoredUrl(value)

  if (resolvedUserId != null && String(resolvedUserId).trim() !== '') {
    const endpoint = apiBase
      ? `${apiBase}/api/User/${resolvedUserId}/fotograf`
      : `/api/User/${resolvedUserId}/fotograf`
    return appendCacheKey(endpoint, cacheKey)
  }

  if (/^https?:\/\//i.test(value)) {
    return appendCacheKey(value, cacheKey)
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  const absolute = apiBase ? `${apiBase}${normalizedPath}` : normalizedPath
  return appendCacheKey(absolute, cacheKey)
}
