import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAdminOnlyPath } from '@/config/navigation'
import { usePermissions } from './use-permissions'
import { normalizeUrl } from '../utils/permission-logic'

export const PERMISSION_DENIED_KEY = 'prestij-permission-denied'

export function useRequirePagePermission() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasReadPermission, hasWritePermission, hasAssignedWrite, loading, isAdmin } =
    usePermissions()

  const path = normalizeUrl(location.pathname)
  const searchParams = new URLSearchParams(location.search)
  const canEditAnsweredSurveys = hasAssignedWrite('/anket-cevaplari')
  const editingAnsweredSurvey =
    path === '/anket-doldurma' &&
    searchParams.get('duzenle') === '1' &&
    canEditAnsweredSurveys
  const editingOwnSurvey =
    path === '/anket-doldurma' &&
    searchParams.get('kendi') === '1' &&
    hasReadPermission('/cevapladigim-anketler')
  const canRead =
    (isAdminOnlyPath(path) ? isAdmin : hasReadPermission(path)) ||
    editingAnsweredSurvey ||
    editingOwnSurvey
  const canEdit =
    hasWritePermission(path) || editingAnsweredSurvey || editingOwnSurvey

  useEffect(() => {
    if (loading) return
    if (canRead) return

    sessionStorage.setItem(
      PERMISSION_DENIED_KEY,
      'Bu sayfaya erişim yetkiniz bulunmamaktadır.',
    )
    navigate('/', { replace: true })
  }, [canRead, loading, navigate])

  return { canRead, canEdit, loading }
}
