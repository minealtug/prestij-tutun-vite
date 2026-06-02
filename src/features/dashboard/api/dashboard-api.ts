import { apiClient } from '@/lib/api/api-client'
import type { DashboardActivity, DashboardSummary } from '../types/dashboard.types'

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),

  getRecentActivity: () => apiClient.get<DashboardActivity[]>('/dashboard/activity'),
}
