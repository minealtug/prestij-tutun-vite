import { useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  refreshPermissionsCache,
  usePermissionsStore,
} from '../stores/permissions-store'
import { isAdminOnlyPath } from '@/config/navigation'
import { checkReadPermission, checkWritePermission, normalizeUrl } from '../utils/permission-logic'

export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const userPermissions = usePermissionsStore((s) => s.userPermissions)
  const menuPermissions = usePermissionsStore((s) => s.menuPermissions)
  const assignedPermissions = usePermissionsStore((s) => s.assignedPermissions)
  const loading = usePermissionsStore((s) => s.loading)
  const initialized = usePermissionsStore((s) => s.initialized)

  const isAdmin = Boolean(user?.admin)
  const assignedSet = useMemo(() => new Set(assignedPermissions), [assignedPermissions])

  const hasPermission = useCallback(
    (yetkiId: number) => isAdmin || userPermissions.includes(yetkiId),
    [isAdmin, userPermissions],
  )

  const hasReadPermission = useCallback(
    (url: string) => {
      if (isAdminOnlyPath(normalizeUrl(url))) return isAdmin
      return checkReadPermission(url, menuPermissions, userPermissions, assignedSet, isAdmin)
    },
    [assignedSet, isAdmin, menuPermissions, userPermissions],
  )

  const hasWritePermission = useCallback(
    (url: string) => {
      if (isAdminOnlyPath(normalizeUrl(url))) return isAdmin
      return checkWritePermission(url, menuPermissions, userPermissions, assignedSet, isAdmin)
    },
    [assignedSet, isAdmin, menuPermissions, userPermissions],
  )

  const canAccessYetkilendirme = isAdmin

  return {
    loading: loading || !initialized,
    isAdmin,
    permissions: userPermissions,
    menuPermissions,
    assignedPermissions,
    hasPermission,
    hasReadPermission,
    hasWritePermission,
    canAccessYetkilendirme,
    refreshPermissions: refreshPermissionsCache,
  }
}
