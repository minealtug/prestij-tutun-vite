function appendCacheKey(url: string, cacheKey?: string | number | null): string {
  if (cacheKey == null || cacheKey === '') return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(String(cacheKey))}`
}

export function resolveUserPhotoUrl(
  fotografUrl: string | null | undefined,
  cacheKey?: string | number | null,
): string | null {
  const value = fotografUrl?.trim()
  if (!value) return null

  if (/^https?:\/\//i.test(value)) {
    return appendCacheKey(value, cacheKey)
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const absolute = apiBase ? `${apiBase}${normalizedPath}` : normalizedPath
  return appendCacheKey(absolute, cacheKey)
}
