export interface DashboardSummary {
  totalUsers: number
  activeUsers: number
  revenue: number
  growthPercent: number
}

export interface DashboardActivity {
  id: string
  title: string
  description: string
  createdAt: string
}
