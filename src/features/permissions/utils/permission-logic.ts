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

export function checkReadPermission(
  url: string,
  menuPermissions: MenuPermissionMap,
  userPermissions: number[],
  assignedPermissions: Set<number>,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true

  const entries = menuPermissions[normalizeUrl(url)]
  if (!entries?.length) return true

  const okuma = filterByTuru(entries, YETKI_OKUMA)
  const yazma = filterByTuru(entries, YETKI_YAZMA)

  if (yazma.length > 0 && okuma.length === 0) return true

  if (okuma.length > 0 && yazma.length === 0) {
    const allAssigned = okuma.every((e) => assignedPermissions.has(e.yetkiId))
    if (!allAssigned) return true
    return okuma.some((e) => userPermissions.includes(e.yetkiId))
  }

  if (okuma.length > 0 && yazma.length > 0) {
    const allOkumaAssigned = okuma.every((e) => assignedPermissions.has(e.yetkiId))
    const allYazmaAssigned = yazma.every((e) => assignedPermissions.has(e.yetkiId))
    if (!allOkumaAssigned || !allYazmaAssigned) return true
    const allIds = [...okuma, ...yazma].map((e) => e.yetkiId)
    return allIds.some((id) => userPermissions.includes(id))
  }

  return true
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
    const allAssigned = yazma.every((e) => assignedPermissions.has(e.yetkiId))
    if (!allAssigned) return true
    return yazma.some((e) => userPermissions.includes(e.yetkiId))
  }

  if (okuma.length > 0 && yazma.length === 0) {
    const allAssigned = okuma.every((e) => assignedPermissions.has(e.yetkiId))
    if (!allAssigned) return true
    return okuma.some((e) => userPermissions.includes(e.yetkiId))
  }

  if (okuma.length > 0 && yazma.length > 0) {
    const allYazmaAssigned = yazma.every((e) => assignedPermissions.has(e.yetkiId))
    if (!allYazmaAssigned) return true
    return yazma.some((e) => userPermissions.includes(e.yetkiId))
  }

  return false
}
