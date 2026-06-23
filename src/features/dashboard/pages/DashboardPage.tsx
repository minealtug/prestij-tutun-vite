import { useAuthStore } from '@/stores/auth-store'
import { AdminDashboardPage } from './AdminDashboardPage'
import { UserDashboardPage } from './UserDashboardPage'

export function DashboardPage() {
  const isAdmin = useAuthStore((state) => Boolean(state.user?.admin))

  if (isAdmin) {
    return <AdminDashboardPage />
  }

  return <UserDashboardPage />
}
