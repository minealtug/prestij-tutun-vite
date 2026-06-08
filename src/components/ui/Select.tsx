import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DropdownListPortal } from './dropdown-list'

export interface SelectOption {
  key?: string
  value: string
  label: string
}

export interface SelectProps {
  label?: string
  error?: string
  options: SelectOption[]
  value?: string
  disabled?: boolean
  required?: boolean
  id?: string
  className?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
}

function emitChange(onChange: SelectProps['onChange'], value: string) {
  onChange?.({ target: { value } } as ChangeEvent<HTMLSelectElement>)
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, label, error, id, options, value = '', disabled, required, onChange }, ref) => {
    const listId = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const [isOpen, setIsOpen] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(0)

    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const selectedOption = options.find((o) => o.value === value)
    const displayLabel = selectedOption?.label ?? options[0]?.label ?? 'Seçin'

    useEffect(() => {
      if (!isOpen) return

      const onPointerDown = (e: MouseEvent) => {
        const target = e.target as Node
        if (rootRef.current?.contains(target)) return
        setIsOpen(false)
      }

      document.addEventListener('mousedown', onPointerDown)
      return () => document.removeEventListener('mousedown', onPointerDown)
    }, [isOpen])

    useEffect(() => {
      if (!isOpen) return
      const index = options.findIndex((o) => o.value === value)
      setHighlightIndex(index >= 0 ? index : 0)
    }, [isOpen, options, value])

    const selectOption = (option: SelectOption) => {
      emitChange(onChange, option.value)
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return

      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && options[highlightIndex]) {
        e.preventDefault()
        selectOption(options[highlightIndex])
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    return (
      <div ref={rootRef} className={cn('flex w-full flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            ref={(node) => {
              triggerRef.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            id={selectId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-invalid={Boolean(error)}
            aria-required={required}
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={onKeyDown}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface-elevated px-3 text-left text-sm text-foreground',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !selectedOption?.value && 'text-muted',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            )}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 text-muted transition-transform', isOpen && 'rotate-180')}
              aria-hidden
            />
          </button>

          <DropdownListPortal open={isOpen && !disabled} anchorRef={triggerRef} id={listId}>
            {options.map((option, index) => (
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
            ))}
          </DropdownListPortal>
        </div>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
