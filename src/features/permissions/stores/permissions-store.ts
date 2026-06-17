import { create } from 'zustand'
import type { MenuPermissionMap } from '../types/permission.types'

const USER_KEY = 'prestij-user-permissions'
const MENU_KEY = 'prestij-menu-permissions'
const ALLOWED_URLS_KEY = 'prestij-allowed-menu-urls'
const ASSIGNED_KEY = 'prestij-assigned-permissions'
const ASSIGNED_AT_KEY = 'prestij-assigned-permissions-at'

/** Atanmış yetki listesi bu süre boyunca yeniden taranmaz (ms). */
const ASSIGNED_CACHE_TTL_MS = 30 * 60 * 1000

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
  allowedMenuUrls: string[],
  assignedPermissions: number[],
  options?: { touchAssignedAt?: boolean },
) {
  localStorage.setItem(USER_KEY, JSON.stringify(userPermissions))
  localStorage.setItem(MENU_KEY, JSON.stringify(menuPermissions))
  localStorage.setItem(ALLOWED_URLS_KEY, JSON.stringify(allowedMenuUrls))
  localStorage.setItem(ASSIGNED_KEY, JSON.stringify(assignedPermissions))
  if (options?.touchAssignedAt !== false) {
    localStorage.setItem(ASSIGNED_AT_KEY, String(Date.now()))
  }
}

function clearCache() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(MENU_KEY)
  localStorage.removeItem(ALLOWED_URLS_KEY)
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
  allowedMenuUrls: string[]
  assignedPermissions: number[]
  loading: boolean
  initialized: boolean
  reloadToken: number
  setLoading: (loading: boolean) => void
  setPermissions: (
    userPermissions: number[],
    menuPermissions: MenuPermissionMap,
    allowedMenuUrls: string[],
    assignedPermissions: number[],
    options?: { touchAssignedAt?: boolean },
  ) => void
  requestReload: () => void
  clear: () => void
}

export const usePermissionsStore = create<PermissionsState>((set) => ({
  userPermissions: [],
  menuPermissions: {},
  allowedMenuUrls: [],
  assignedPermissions: [],
  loading: false,
  initialized: false,
  reloadToken: 0,
  setLoading: (loading) =>
    set((state) => ({
      loading,
      initialized: loading ? false : state.initialized,
    })),
  setPermissions: (userPermissions, menuPermissions, allowedMenuUrls, assignedPermissions, options) => {
    writeCache(userPermissions, menuPermissions, allowedMenuUrls, assignedPermissions, options)
    set({
      userPermissions,
      menuPermissions,
      allowedMenuUrls,
      assignedPermissions,
      initialized: true,
      loading: false,
    })
  },
  requestReload: () => set((state) => ({ reloadToken: state.reloadToken + 1 })),
  clear: () => {
    clearCache()
    set({
      userPermissions: [],
      menuPermissions: {},
      allowedMenuUrls: [],
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
