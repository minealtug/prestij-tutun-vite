import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUiStore } from '@/stores/ui-store'
import { isAdminOnlyPath, sidebarSections, type NavItem } from '@/config/navigation'
import { usePermissions } from '@/features/permissions/hooks/use-permissions'

const APP_NAME = 'AGRIVION'

function isItemVisible(item: NavItem, hasReadPermission: (url: string) => boolean, isAdmin: boolean) {
  if (item.to && isAdminOnlyPath(item.to)) return isAdmin
  if (item.to === '/') return true

  if (item.children?.length) {
    return item.children.some(
      (child) => child.to && (child.to === '/' || hasReadPermission(child.to)),
    )
  }

  if (item.to) return hasReadPermission(item.to)
  return true
}

function filterNavItems(
  items: NavItem[],
  hasReadPermission: (url: string) => boolean,
  isAdmin: boolean,
): NavItem[] {
  return items
    .filter((item) => isItemVisible(item, hasReadPermission, isAdmin))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter(
              (child) => !child.to || child.to === '/' || hasReadPermission(child.to),
            ),
          }
        : item,
    )
}

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebarOpen } =
    useUiStore()
  const location = useLocation()
  const { hasReadPermission, isAdmin, loading } = usePermissions()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Tanımlamalar: true })

  const visibleSections = useMemo(
    () =>
      sidebarSections
        .map((section) => ({
          ...section,
          items: filterNavItems(section.items, hasReadPermission, isAdmin),
        }))
        .filter((section) => section.items.length > 0),
    [hasReadPermission, isAdmin],
  )

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-r-lg border-l-[3px] py-2.5 text-sm font-medium transition-all duration-200',
      isActive
        ? 'border-sidebar-active bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
        : 'border-transparent text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white',
      sidebarCollapsed ? 'justify-center px-2' : 'px-3 pl-[calc(0.75rem-3px)]',
    )

  const content = (
    <>
      <div
        className={cn(
          'relative flex h-10 shrink-0 items-center border-b border-white/10',
          sidebarCollapsed ? 'justify-center px-1' : 'justify-end px-2',
        )}
      >
        {!sidebarCollapsed && (
          <span className="pointer-events-none absolute left-[46%] -translate-x-1/2 text-sm font-extrabold tracking-wider text-white/90">
            {APP_NAME}
          </span>
        )}
        <button
          type="button"
          className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Menüyü kapat"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="hidden rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {loading && !sidebarCollapsed && (
          <p className="px-3 text-xs text-white/50">Menü yükleniyor…</p>
        )}
        {visibleSections.map((section) => (
          <div key={section.title ?? 'main'}>
            {section.title && !sidebarCollapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                {section.title}
              </p>
            )}
            {section.title && sidebarCollapsed && (
              <div className="mb-2 border-t border-white/10" aria-hidden />
            )}
            <ul className="space-y-1">
              {section.items.map(({ to, label, icon: Icon, end, children }) => {
                if (children?.length) {
                  const isChildActive = children.some((child) =>
                    child.to ? location.pathname.startsWith(child.to) : false,
                  )
                  const isOpen = openGroups[label] ?? isChildActive

                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => setOpenGroups((prev) => ({ ...prev, [label]: !isOpen }))}
                        className={cn(
                          linkClass({ isActive: isChildActive }),
                          'w-full',
                          !sidebarCollapsed && 'justify-between',
                        )}
                        title={sidebarCollapsed ? label : undefined}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5 shrink-0" />
                          {!sidebarCollapsed && <span>{label}</span>}
                        </span>
                        {!sidebarCollapsed && (
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                          />
                        )}
                      </button>
                      {!sidebarCollapsed && isOpen && (
                        <ul className="mt-1 space-y-1 pl-4">
                          {children.map((child) => (
                            <li key={child.to ?? child.label}>
                              <NavLink
                                to={child.to ?? '/'}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={({ isActive }) =>
                                  cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                    isActive
                                      ? 'bg-white/10 text-white'
                                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                                  )
                                }
                              >
                                <child.icon className="h-4 w-4 shrink-0" />
                                <span>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                }

                return (
                  <li key={to ?? label}>
                    <NavLink
                      to={to ?? '/'}
                      end={end}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={linkClass}
                      title={sidebarCollapsed ? label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 border-t border-white/10 p-4', sidebarCollapsed && 'text-center')}>
        {!sidebarCollapsed && (
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Prestij Tütün</p>
        )}
      </div>
    </>
  )

  return (
    <>
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed top-16 right-0 bottom-0 left-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          aria-label="Overlay kapat"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 bottom-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-300',
          'lg:static lg:top-auto lg:z-auto lg:h-auto lg:self-stretch',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {content}
      </aside>
    </>
  )
}
