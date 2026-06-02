import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { dashboardApi } from '../api/dashboard-api'

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => dashboardApi.getSummary(),
  })
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: () => dashboardApi.getRecentActivity(),
  })
}
