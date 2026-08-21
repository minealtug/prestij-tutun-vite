import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { MintikaOptionDto } from '../types/user.types'

interface MintikaMultiSelectProps {
  value: number[]
  options: MintikaOptionDto[]
  onChange: (value: number[]) => void
  disabled?: boolean
  loading?: boolean
  error?: string
}

export function MintikaMultiSelect({
  value,
  options,
  onChange,
  disabled = false,
  loading = false,
  error,
}: MintikaMultiSelectProps) {
  const [query, setQuery] = useState('')

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR')
    if (!q) return options
    return options.filter((item) => item.adi.toLocaleLowerCase('tr-TR').includes(q))
  }, [options, query])

  const selectedSet = useMemo(() => new Set(value), [value])

  const toggle = (id: number) => {
    if (disabled) return
    if (selectedSet.has(id)) {
      onChange(value.filter((item) => item !== id))
      return
    }
    onChange([...value, id])
  }

  const selectAll = () => {
    if (disabled) return
    onChange(options.map((item) => item.id))
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  const selectedLabels = options
    .filter((item) => selectedSet.has(item.id))
    .map((item) => item.adi)
    .join(', ')

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Mıntıka</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={disabled || loading} onClick={selectAll}>
            Tümünü seç
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={disabled || loading} onClick={clearAll}>
            Temizle
          </Button>
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={loading ? 'Mıntıkalar yükleniyor...' : 'Mıntıka ara...'}
        disabled={disabled || loading}
        className="h-9 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
        {loading ? (
          <p className="px-1 py-2 text-sm text-muted">Mıntıkalar yükleniyor...</p>
        ) : filteredOptions.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted">Mıntıka bulunamadı</p>
        ) : (
          filteredOptions.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/10">
              <input
                type="checkbox"
                checked={selectedSet.has(item.id)}
                onChange={() => toggle(item.id)}
                disabled={disabled}
                className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-foreground">{item.adi}</span>
            </label>
          ))
        )}
      </div>

      <p className="text-xs text-muted">
        {value.length === 0
          ? 'Seçim yok — kullanıcıya mıntıka yetkisi atanmaz.'
          : `${value.length} mıntıka: ${selectedLabels}`}
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
