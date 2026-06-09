import { create } from 'zustand'
import type { MenuPermissionMap } from '../types/permission.types'

const USER_KEY = 'prestij-user-permissions'
const MENU_KEY = 'prestij-menu-permissions'
const ASSIGNED_KEY = 'prestij-assigned-permissions'
const ASSIGNED_AT_KEY = 'prestij-assigned-permissions-at'

/** Atanmış yetki listesi bu süre boyunca yeniden taranmaz (ms). */
const ASSIGNED_CACHE_TTL_MS = 30 * 60 * 1000

function readNumberArray(key: string): number[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(Number).filter((n) => Number.isFinite(n))
  } catch {
    return []
  }
}

function readMenuMap(key: string): MenuPermissionMap {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as MenuPermissionMap) : {}
  } catch {
    return {}
  }
}

function readAssignedFetchedAt(): number | null {
  const raw = localStorage.getItem(ASSIGNED_AT_KEY)
  if (!raw) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

export function isAssignedCacheFresh(): boolean {
  const fetchedAt = readAssignedFetchedAt()
  if (fetchedAt == null) return false
  return Date.now() - fetchedAt < ASSIGNED_CACHE_TTL_MS
}

function writeCache(
  userPermissions: number[],
  menuPermissions: MenuPermissionMap,
  assignedPermissions: number[],
  options?: { touchAssignedAt?: boolean },
) {
  localStorage.setItem(USER_KEY, JSON.stringify(userPermissions))
  localStorage.setItem(MENU_KEY, JSON.stringify(menuPermissions))
  localStorage.setItem(ASSIGNED_KEY, JSON.stringify(assignedPermissions))
  if (options?.touchAssignedAt !== false) {
    localStorage.setItem(ASSIGNED_AT_KEY, String(Date.now()))
  }
}

function clearCache() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(MENU_KEY)
  localStorage.removeItem(ASSIGNED_KEY)
  localStorage.removeItem(ASSIGNED_AT_KEY)
}

export function invalidateAssignedCache() {
  localStorage.removeItem(ASSIGNED_KEY)
  localStorage.removeItem(ASSIGNED_AT_KEY)
}

interface PermissionsState {
  userPermissions: number[]
  menuPermissions: MenuPermissionMap
  assignedPermissions: number[]
  loading: boolean
  initialized: boolean
  reloadToken: number
  setLoading: (loading: boolean) => void
  setPermissions: (
    userPermissions: number[],
    menuPermissions: MenuPermissionMap,
    assignedPermissions: number[],
    options?: { touchAssignedAt?: boolean },
  ) => void
  hydrateFromCache: () => void
  requestReload: () => void
  clear: () => void
}

export const usePermissionsStore = create<PermissionsState>((set) => ({
  userPermissions: readNumberArray(USER_KEY),
  menuPermissions: readMenuMap(MENU_KEY),
  assignedPermissions: readNumberArray(ASSIGNED_KEY),
  loading: false,
  initialized: false,
  reloadToken: 0,
  setLoading: (loading) => set({ loading }),
  setPermissions: (userPermissions, menuPermissions, assignedPermissions, options) => {
    writeCache(userPermissions, menuPermissions, assignedPermissions, options)
    set({
      userPermissions,
      menuPermissions,
      assignedPermissions,
      initialized: true,
      loading: false,
    })
  },
  hydrateFromCache: () =>
    set({
      userPermissions: readNumberArray(USER_KEY),
      menuPermissions: readMenuMap(MENU_KEY),
      assignedPermissions: readNumberArray(ASSIGNED_KEY),
      initialized: true,
    }),
  requestReload: () => set((state) => ({ reloadToken: state.reloadToken + 1 })),
  clear: () => {
    clearCache()
    set({
      userPermissions: [],
      menuPermissions: {},
      assignedPermissions: [],
      initialized: false,
      loading: false,
    })
  },
}))

/** Eski davranış: tam sayfa yenileme (artık tercih edilmez). */
export function refreshPermissionsCache() {
  invalidateAssignedCache()
  usePermissionsStore.getState().requestReload()
}
