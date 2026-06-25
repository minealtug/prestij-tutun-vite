import { Menu, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { UserAvatar } from '@/features/users/components/UserAvatar'
import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionsStore } from '@/features/permissions/stores/permissions-store'
import { Button } from '@/components/ui/Button'

const HEADER_TITLE = 'PRESTİJ TÜTÜN A.Ş.'

export function Header() {
  const navigate = useNavigate()
  const { setMobileSidebarOpen } = useUiStore()
  const { user, clearSession } = useAuthStore()
  const clearPermissions = usePermissionsStore((s) => s.clear)

  const handleLogout = () => {
    clearPermissions()
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-4 border-b border-border/80 bg-surface-elevated/95 px-4 shadow-[0_1px_3px_rgba(15,40,71,0.06),0_4px_12px_rgba(15,40,71,0.04)] backdrop-blur-md md:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-muted hover:bg-primary-500/10 lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Menüyü aç"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-wide text-foreground md:text-xl">
          {HEADER_TITLE}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            'hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 sm:flex',
          )}
        >
          <UserAvatar
            fullName={user?.fullName ?? 'Kullanıcı'}
            fotografUrl={user?.fotografUrl}
            cacheKey={user?.id}
            className="h-8 w-8 border-0 bg-transparent"
            imageClassName="h-8 w-8"
            initialsClassName="font-bold text-white"
          />
          <div className="hidden text-left md:block">
            <p className="text-xs font-medium text-foreground">{user?.fullName ?? 'Kullanıcı'}</p>
            <p className="text-[10px] text-muted">{user?.userName ?? user?.email ?? ''}</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Çıkış">
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Çıkış</span>
        </Button>
      </div>
    </header>
  )
}
