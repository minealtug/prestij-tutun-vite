import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
  maxVisible = DEFAULT_MAX_VISIBLE,
  className,
}: SearchableSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption?.label ?? '')
    }
  }, [selectedOption, isOpen])

  const filteredOptions = useMemo(() => {
    const q = normalizeForSearch(query)
    const matches = q
      ? options.filter((o) => normalizeForSearch(o.label).includes(q))
      : options
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
        setQuery(selectedOption?.label ?? '')
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isOpen, selectedOption?.label])

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
      setQuery(selectedOption?.label ?? '')
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
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
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
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            'relative z-10 h-10 w-full rounded-lg border border-border bg-surface-elevated py-2 pr-9 pl-3 text-sm text-foreground',
            'placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />

        {isOpen && !disabled && (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-lg"
          >
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
          </ul>
        )}
      </div>
    </div>
  )
}
