import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

const EMPTY_LABEL = '(Boş)'
const PANEL_WIDTH = 340
const PANEL_MAX_HEIGHT = 380
const GAP = 4
const MARGIN = 8

interface ColumnHeaderFilterProps {
  label: string
  values: string[]
  selected: ReadonlySet<string> | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (next: Set<string> | undefined) => void
}

function displayValue(value: string): string {
  return value || EMPTY_LABEL
}

export function ColumnHeaderFilter({
  label,
  values,
  selected,
  open,
  onOpenChange,
  onChange,
}: ColumnHeaderFilterProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [placed, setPlaced] = useState(false)

  const isActive = Boolean(selected)
  const selectedSet = selected ?? new Set(values)

  const filteredValues = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR')
    if (!query) return values
    return values.filter((value) => displayValue(value).toLocaleLowerCase('tr-TR').includes(query))
  }, [search, values])

  const allVisibleSelected =
    filteredValues.length > 0 && filteredValues.every((value) => selectedSet.has(value))
  const someVisibleSelected = filteredValues.some((value) => selectedSet.has(value))

  const updatePosition = () => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const panel = panelRef.current
    const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - MARGIN * 2)
    const panelHeight = panel?.offsetHeight ?? 0

    let left = rect.left
    if (left + panelWidth > window.innerWidth - MARGIN) {
      left = window.innerWidth - panelWidth - MARGIN
    }
    left = Math.max(MARGIN, left)

    let top = rect.bottom + GAP
    if (panelHeight > 0 && top + panelHeight > window.innerHeight - MARGIN) {
      const above = rect.top - panelHeight - GAP
      top = above >= MARGIN ? above : Math.max(MARGIN, window.innerHeight - panelHeight - MARGIN)
    }

    setPosition((prev) => (prev.top === top && prev.left === left ? prev : { top, left }))
    setPlaced(true)
  }

  useLayoutEffect(() => {
    if (!open) {
      setPlaced(false)
      return
    }
    updatePosition()
  }, [open, filteredValues.length, search])

  useEffect(() => {
    if (!open) return
    setSearch('')
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      onOpenChange(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  const commit = (next: Set<string>) => {
    if (next.size === values.length) {
      onChange(undefined)
      return
    }
    onChange(next)
  }

  const toggleAllVisible = () => {
    const next = new Set(selectedSet)
    if (allVisibleSelected) {
      for (const value of filteredValues) next.delete(value)
    } else {
      for (const value of filteredValues) next.add(value)
    }
    commit(next)
  }

  const toggleValue = (value: string) => {
    const next = new Set(selectedSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    commit(next)
  }

  return (
    <div ref={anchorRef} className="inline-flex items-center gap-1">
      <span>{label}</span>
      <button
        type="button"
        aria-label={`${label} kolonunu filtrele`}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          onOpenChange(!open)
        }}
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded text-muted hover:bg-primary-50 hover:text-primary-700',
          (open || isActive) && 'bg-primary-50 text-primary-700',
        )}
      >
        <Filter className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={`${label} filtresi`}
              style={{
                top: position.top,
                left: position.left,
                width: PANEL_WIDTH,
                maxHeight: PANEL_MAX_HEIGHT,
                visibility: placed ? 'visible' : 'hidden',
              }}
              className="fixed z-[220] flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="border-b border-border px-3 py-2">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="aramak için metni girin"
                  className="h-8 w-full rounded-md border border-border bg-white px-2 text-xs text-foreground placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
                <label className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) element.indeterminate = someVisibleSelected && !allVisibleSelected
                    }}
                    onChange={toggleAllVisible}
                    disabled={filteredValues.length === 0}
                    className="h-3.5 w-3.5 accent-primary-600"
                  />
                  Tüm
                </label>

                {filteredValues.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted">Eşleşen değer yok</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {filteredValues.map((value) => (
                      <label
                        key={value || EMPTY_LABEL}
                        className="flex min-w-0 items-center gap-2 text-xs text-foreground"
                        title={displayValue(value)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(value)}
                          onChange={() => toggleValue(value)}
                          className="h-3.5 w-3.5 shrink-0 accent-primary-600"
                        />
                        <span className="truncate">{displayValue(value)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border bg-[#f7f8fa] px-3 py-2">
                <button
                  type="button"
                  className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => onChange(undefined)}
                >
                  Filtreyi temizle
                </button>
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Kapat
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
