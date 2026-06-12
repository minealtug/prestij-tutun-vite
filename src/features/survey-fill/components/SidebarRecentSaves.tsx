import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { useUiStore } from '@/stores/ui-store'
import { useSurveyFillRecentStore } from '../stores/survey-fill-recent-store'

function formatSavedAt(savedAt: number) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(savedAt))
}

export function SidebarRecentSaves() {
  const navigate = useNavigate()
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen)
  const items = useSurveyFillRecentStore((state) => state.items)

  const recentItems = useMemo(() => items.slice(0, 5), [items])

  if (recentItems.length === 0 || sidebarCollapsed) return null

  const openSession = (item: (typeof recentItems)[number]) => {
    const params = new URLSearchParams({
      baslikId: String(item.baslikId),
      sablonId: String(item.sablonId),
      ekiciId: item.ekiciId,
    })
    setMobileSidebarOpen(false)
    navigate(`/anket-doldurma?${params.toString()}`)
  }

  return (
    <div className="mt-1 space-y-1 pl-4">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Son kaydedilenler
      </p>
      <ul className="space-y-0.5">
        {recentItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => openSession(item)}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left transition-colors',
                'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <p className="truncate text-xs font-medium">{item.baslikAdi}</p>
              <p className="truncate text-[11px] text-white/50">
                {item.sablonAdi} · {item.ekiciAdi}
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">{formatSavedAt(item.savedAt)}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
