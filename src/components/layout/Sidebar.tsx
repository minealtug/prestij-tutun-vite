import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUiStore } from '@/stores/ui-store'
import { sidebarSections } from '@/config/navigation'

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebarOpen } =
    useUiStore()

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
          'flex h-10 shrink-0 items-center border-b border-white/10',
          sidebarCollapsed ? 'justify-center px-1' : 'justify-end px-2',
        )}
      >
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
        {sidebarSections.map((section) => (
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
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={linkClass}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && <span>{label}</span>}
                  </NavLink>
                </li>
              ))}
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
