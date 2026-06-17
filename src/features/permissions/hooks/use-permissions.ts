import { useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  refreshPermissionsCache,
  usePermissionsStore,
} from '../stores/permissions-store'
import { isAdminOnlyPath } from '@/config/navigation'
import {
  checkReadPermission,
  checkWritePermission,
  normalizeUrl,
} from '../utils/permission-logic'

export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const userPermissions = usePermissionsStore((s) => s.userPermissions)
  const menuPermissions = usePermissionsStore((s) => s.menuPermissions)
  const allowedMenuUrls = usePermissionsStore((s) => s.allowedMenuUrls)
  const assignedPermissions = usePermissionsStore((s) => s.assignedPermissions)
  const loading = usePermissionsStore((s) => s.loading)
  const initialized = usePermissionsStore((s) => s.initialized)

  const isAdmin = Boolean(user?.admin)
  const allowedMenuUrlSet = useMemo(
    () => new Set(allowedMenuUrls.map(normalizeUrl)),
    [allowedMenuUrls],
  )
  const assignedSet = useMemo(() => new Set(assignedPermissions), [assignedPermissions])

  const hasPermission = useCallback(
    (yetkiId: number) => isAdmin || userPermissions.includes(yetkiId),
    [isAdmin, userPermissions],
  )

  const hasReadPermission = useCallback(
    (url: string) => {
      const path = normalizeUrl(url)
      if (isAdminOnlyPath(path)) return isAdmin
      if (isAdmin) return true

      if (allowedMenuUrlSet.size > 0) {
        return allowedMenuUrlSet.has(path)
      }

      return checkReadPermission(path, menuPermissions, userPermissions, assignedSet, isAdmin)
    },
    [allowedMenuUrlSet, assignedSet, isAdmin, menuPermissions, userPermissions],
  )

  const hasWritePermission = useCallback(
    (url: string) => {
      const path = normalizeUrl(url)
      if (isAdminOnlyPath(path)) return isAdmin
      if (isAdmin) return true
      if (!hasReadPermission(path)) return false
      return checkWritePermission(path, menuPermissions, userPermissions, assignedSet, isAdmin)
    },
    [assignedSet, hasReadPermission, isAdmin, menuPermissions, userPermissions],
  )

  const canAccessYetkilendirme = isAdmin

  return {
    loading: loading || !initialized,
    isAdmin,
    permissions: userPermissions,
    menuPermissions,
    allowedMenuUrls,
    assignedPermissions,
    hasPermission,
    hasReadPermission,
    hasWritePermission,
    canAccessYetkilendirme,
    refreshPermissions: refreshPermissionsCache,
  }
}
