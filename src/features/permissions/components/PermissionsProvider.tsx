import { useEffect, type ReactNode } from 'react'
import { authApi } from '@/features/auth/api/auth-api'
import { mapAuthMeUserToSession } from '@/features/auth/utils/normalize-login-response'
import { useAuthStore } from '@/stores/auth-store'
import { permissionsApi } from '../api/permissions-api'
import {
  isAssignedCacheFresh,
  usePermissionsStore,
} from '../stores/permissions-store'

interface PermissionsProviderProps {
  children: ReactNode
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.user?.id)
  const updateUser = useAuthStore((s) => s.updateUser)
  const setPermissions = usePermissionsStore((s) => s.setPermissions)
  const setLoading = usePermissionsStore((s) => s.setLoading)
  const clear = usePermissionsStore((s) => s.clear)
  const hydrateFromCache = usePermissionsStore((s) => s.hydrateFromCache)
  const reloadToken = usePermissionsStore((s) => s.reloadToken)

  useEffect(() => {
    if (!accessToken || !userId) {
      clear()
      return
    }

    hydrateFromCache()

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const shouldFetchAssigned = !isAssignedCacheFresh()
        const cachedAssigned = usePermissionsStore.getState().assignedPermissions

        const [me, menuMap, assignedIds] = await Promise.all([
          authApi.me(),
          permissionsApi.loadMenuPermissionMap(),
          shouldFetchAssigned
            ? permissionsApi.getAssignedYetkiIds()
            : Promise.resolve(cachedAssigned),
        ])

        if (cancelled) return

        updateUser(mapAuthMeUserToSession(me.user))
        setPermissions(me.yetkiIds, menuMap, assignedIds, {
          touchAssignedAt: shouldFetchAssigned,
        })
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    userId,
    reloadToken,
    clear,
    hydrateFromCache,
    setLoading,
    setPermissions,
    updateUser,
  ])

  return <>{children}</>
}
