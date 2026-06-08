import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DropdownListPortal } from './dropdown-list'

export interface SearchableSelectOption {
  value: string
  label: string
  key?: string
}

export interface SearchableSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
  error?: string
  maxVisible?: number
  className?: string
}

const DEFAULT_MAX_VISIBLE = 80

function normalizeForSearch(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Ara veya seç...',
  emptyMessage = 'Sonuç bulunamadı',
  error,
  maxVisible = DEFAULT_MAX_VISIBLE,
  className,
}: SearchableSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(
    () => (value ? options.find((o) => o.value === value) : undefined),
    [options, value],
  )

  const displayQuery = value ? (selectedOption?.label ?? '') : ''

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setQuery(displayQuery)
    }
  }, [displayQuery, isOpen])

  const filteredOptions = useMemo(() => {
    const selectable = options.filter((o) => o.value !== '')
    const q = normalizeForSearch(query)
    const matches = q
      ? selectable.filter((o) => normalizeForSearch(o.label).includes(q))
      : selectable
    return matches.slice(0, maxVisible)
  }, [options, query, maxVisible])

  useEffect(() => {
    setHighlightIndex(0)
  }, [query, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setQuery(displayQuery)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isOpen, displayQuery])

  const selectOption = (option: SearchableSelectOption) => {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true)
      return
    }
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filteredOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredOptions[highlightIndex]) {
      e.preventDefault()
      selectOption(filteredOptions[highlightIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery(displayQuery)
      inputRef.current?.blur()
    }
  }

  const inputId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div ref={rootRef} className={cn('flex w-full flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div ref={anchorRef} className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            if (!e.target.value.trim() && value) {
              onChange('')
            }
          }}
          onFocus={() => {
            setIsOpen(true)
            if (!value) setQuery('')
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'relative z-10 h-10 w-full rounded-lg border border-border bg-surface-elevated py-2 pr-9 pl-3 text-sm text-foreground',
            'placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          )}
        />
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted transition-transform',
            isOpen && 'rotate-180',
          )}
          aria-hidden
        />

        <DropdownListPortal open={isOpen && !disabled} anchorRef={anchorRef} id={listId}>
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">{emptyMessage}</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.key ?? option.value}
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm text-foreground',
                  index === highlightIndex && 'bg-primary-500/10',
                  option.value === value && 'font-medium text-primary-700',
                  option.value === '' && 'text-muted',
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </li>
            ))
          )}
          {options.length > maxVisible && filteredOptions.length === maxVisible && (
            <li className="border-t border-border px-3 py-2 text-xs text-muted">
              Daha fazla sonuç için aramaya devam edin…
            </li>
          )}
        </DropdownListPortal>
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
