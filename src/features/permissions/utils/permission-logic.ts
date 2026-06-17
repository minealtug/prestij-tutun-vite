import {
  YETKI_OKUMA,
  YETKI_YAZMA,
  type MenuPermissionEntry,
  type MenuPermissionMap,
} from '../types/permission.types'

export function normalizeUrl(url: string): string {
  if (!url) return '/'
  const path = (url.split('?')[0] ?? url).trim()
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path || '/'
}

function pickMenuUrlFromPermissionItem(item: unknown): string | null {
  if (typeof item === 'string') {
    const trimmed = item.trim()
    return trimmed.startsWith('/') ? normalizeUrl(trimmed) : null
  }

  if (!item || typeof item !== 'object') return null

  const row = item as Record<string, unknown>
  for (const key of ['menuUrl', 'MenuUrl', 'url', 'Url', 'path', 'Path']) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().startsWith('/')) {
      return normalizeUrl(value)
    }
  }

  return null
}

/** /api/Auth/me → permissions alanından erişilebilir menü URL'leri */
export function mapAllowedMenuUrlsFromApi(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : []
  const urls = list
    .map(pickMenuUrlFromPermissionItem)
    .filter((url): url is string => Boolean(url))

  return [...new Set(urls)]
}

export function buildMenuPermissionMap(
  menus: Array<{ id: number; yetkiId: number; menuUrl: string; yetkiAdi: string }>,
  yetkiler: Array<{ id: number; yetkiTuru: string }>,
): MenuPermissionMap {
  const yetkiById = new Map(yetkiler.map((y) => [y.id, y.yetkiTuru]))
  const map: MenuPermissionMap = {}

  for (const menu of menus) {
    const url = normalizeUrl(menu.menuUrl)
    const yetkiTuru = yetkiById.get(menu.yetkiId) ?? menu.yetkiAdi
    const entry: MenuPermissionEntry = {
      menuId: menu.id,
      yetkiId: menu.yetkiId,
      yetkiTuru,
    }
    if (!map[url]) map[url] = []
    map[url].push(entry)
  }

  return map
}

function filterByTuru(entries: MenuPermissionEntry[], turu: string) {
  return entries.filter((e) => e.yetkiTuru.toLowerCase() === turu.toLowerCase())
}

function getActiveEntries(entries: MenuPermissionEntry[], assignedPermissions: Set<number>) {
  return entries.filter((e) => assignedPermissions.has(e.yetkiId))
}

export function checkReadPermission(
  url: string,
  menuPermissions: MenuPermissionMap,
  userPermissions: number[],
  assignedPermissions: Set<number>,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true

  const entries = menuPermissions[normalizeUrl(url)]
  if (!entries?.length) return false

  const okuma = filterByTuru(entries, YETKI_OKUMA)
  const yazma = filterByTuru(entries, YETKI_YAZMA)

  if (yazma.length > 0 && okuma.length === 0) {
    const active = getActiveEntries(yazma, assignedPermissions)
    if (active.length === 0) return false
    return active.some((e) => userPermissions.includes(e.yetkiId))
  }

  if (okuma.length > 0 && yazma.length === 0) {
    const active = getActiveEntries(okuma, assignedPermissions)
    if (active.length === 0) return false
    return active.some((e) => userPermissions.includes(e.yetkiId))
  }

  if (okuma.length > 0 && yazma.length > 0) {
    const active = getActiveEntries([...okuma, ...yazma], assignedPermissions)
    if (active.length === 0) return false
    return active.some((e) => userPermissions.includes(e.yetkiId))
  }

  return false
}

export function checkWritePermission(
  url: string,
  menuPermissions: MenuPermissionMap,
  userPermissions: number[],
  assignedPermissions: Set<number>,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true

  const entries = menuPermissions[normalizeUrl(url)]
  if (!entries?.length) return false

  const okuma = filterByTuru(entries, YETKI_OKUMA)
  const yazma = filterByTuru(entries, YETKI_YAZMA)

  if (yazma.length > 0 && okuma.length === 0) {
    const active = getActiveEntries(yazma, assignedPermissions)
    if (active.length === 0) return false
    return active.some((e) => userPermissions.includes(e.yetkiId))
  }

  if (okuma.length > 0 && yazma.length === 0) {
    return false
  }

  if (okuma.length > 0 && yazma.length > 0) {
    const active = getActiveEntries(yazma, assignedPermissions)
    if (active.length === 0) return false
    return active.some((e) => userPermissions.includes(e.yetkiId))
  }

  return false
}
