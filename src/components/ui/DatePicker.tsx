import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  formatDisplayDate,
  parseDateValue,
  toDateInputValue,
} from '@/features/survey-fill/utils/date-input-value'

export interface DatePickerProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MIN_YEAR = 1920

function formatIsoDate(date: Date): string {
  return toDateInputValue(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  )
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getCalendarDays(viewDate: Date): Date[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

function getPanelStyle(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect()
  const width = Math.max(rect.width, 288)
  const left = Math.min(rect.left, window.innerWidth - width - 8)
  const estimatedHeight = 360
  const spaceBelow = window.innerHeight - rect.bottom
  const top =
    spaceBelow < estimatedHeight && rect.top > estimatedHeight
      ? rect.top - estimatedHeight - 4
      : rect.bottom + 4

  return { top, left: Math.max(8, left), width }
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'GG.AA.YYYY',
}: DatePickerProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const selectedDate = parseDateValue(value)
  const today = useMemo(() => new Date(), [])
  const maxYear = today.getFullYear() + 10

  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? today)
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 288 })

  const monthLabel = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(viewDate)
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate])
  const years = useMemo(
    () => Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, index) => MIN_YEAR + index).reverse(),
    [maxYear],
  )

  const updatePanelPosition = () => {
    const anchor = rootRef.current
    if (!anchor) return
    setPanelStyle(getPanelStyle(anchor))
  }

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setIsOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', updatePanelPosition, true)
    window.addEventListener('resize', updatePanelPosition)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', updatePanelPosition, true)
      window.removeEventListener('resize', updatePanelPosition)
    }
  }, [isOpen])

  const openPicker = () => {
    if (disabled) return
    setViewDate(parseDateValue(value) ?? new Date())
    if (rootRef.current) {
      setPanelStyle(getPanelStyle(rootRef.current))
    }
    setIsOpen(true)
  }

  const selectDate = (date: Date) => {
    onChange(formatIsoDate(date))
    setIsOpen(false)
  }

  const goToMonth = (offset: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <div ref={rootRef} className="relative">
        <button
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
              return
            }
            openPicker()
          }}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 text-left text-sm',
            selectedDate && !disabled ? 'pr-9' : null,
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              selectedDate ? 'text-foreground' : 'text-muted',
            )}
          >
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
        </button>

        {selectedDate && !disabled ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-primary-500/10 hover:text-foreground"
            aria-label="Tarihi temizle"
            onClick={(event) => {
              event.stopPropagation()
              onChange('')
              setIsOpen(false)
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {isOpen && !disabled
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Takvim"
              style={panelStyle}
              className="fixed z-[200] rounded-xl border border-border bg-surface-elevated p-3 shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted hover:bg-primary-500/10 hover:text-foreground"
                  aria-label="Önceki ay"
                  onClick={() => goToMonth(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                  <span className="text-sm font-medium capitalize text-foreground">
                    {monthLabel}
                  </span>
                  <select
                    aria-label="Yıl"
                    className="rounded-md border border-border bg-surface px-1.5 py-1 text-sm text-foreground"
                    value={viewDate.getFullYear()}
                    onChange={(event) =>
                      setViewDate(new Date(Number(event.target.value), viewDate.getMonth(), 1))
                    }
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted hover:bg-primary-500/10 hover:text-foreground"
                  aria-label="Sonraki ay"
                  onClick={() => goToMonth(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((day) => (
                  <div key={day} className="py-1 text-center text-[11px] font-medium text-muted">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const inCurrentMonth = day.getMonth() === viewDate.getMonth()
                  const selected = selectedDate ? isSameDay(day, selectedDate) : false
                  const isToday = isSameDay(day, today)

                  return (
                    <button
                      key={formatIsoDate(day)}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={cn(
                        'h-8 rounded-md text-sm',
                        inCurrentMonth ? 'text-foreground' : 'text-muted/50',
                        isToday && !selected && 'ring-1 ring-primary-300',
                        selected
                          ? 'bg-primary-500 font-medium text-white'
                          : 'hover:bg-primary-500/10',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                <button
                  type="button"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => selectDate(new Date())}
                >
                  Bugün
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Kapat
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
