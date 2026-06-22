import { useMemo } from 'react'
import { Filter, GitCompareArrows } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { AgeGenderReportFilters } from '../types/age-gender-report.types'

interface AgeGenderReportFiltersProps {
  bolgeler: string[]
  menseiler: { id: number; adi: string }[]
  filters: AgeGenderReportFilters
  onChange: (filters: AgeGenderReportFilters) => void
  onApply: () => void
}

function toOptions(items: { id: number; adi: string }[], placeholder: string) {
  return [
    { value: '', label: placeholder },
    ...items.map((item) => ({ value: String(item.id), label: item.adi })),
  ]
}

function toBolgeOptions(bolgeler: string[], placeholder: string) {
  return [
    { value: '', label: placeholder },
    ...bolgeler.map((b) => ({ value: b, label: b })),
  ]
}

export function AgeGenderReportFiltersBar({
  bolgeler,
  menseiler,
  filters,
  onChange,
  onApply,
}: AgeGenderReportFiltersProps) {
  const yilOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
    return [
      { value: '', label: 'Tüm yıllar' },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ]
  }, [])

  return (
    <div className="glass-card space-y-4 !p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-primary-600" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">Filtreler</h3>
        <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[11px] font-medium text-primary-700">
          Coğrafi kırılım
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Select
          label="Menşei"
          options={toOptions(menseiler, 'Tümü')}
          value={filters.menseiId != null ? String(filters.menseiId) : ''}
          onChange={(e) =>
            onChange({
              ...filters,
              menseiId: e.target.value ? Number(e.target.value) : undefined,
              bolgeId: undefined,
            })
          }
        />
        <Select
          label="Yıl"
          options={yilOptions}
          value={filters.yil != null ? String(filters.yil) : ''}
          onChange={(e) =>
            onChange({
              ...filters,
              yil: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <Select
          label="Karşılaştırma A"
          options={toBolgeOptions(bolgeler, 'Bölge seçin')}
          value={filters.compareBolgeA ?? ''}
          onChange={(e) =>
            onChange({ ...filters, compareBolgeA: e.target.value || undefined })
          }
        />
        <Select
          label="Karşılaştırma B"
          options={toBolgeOptions(bolgeler, 'Bölge seçin')}
          value={filters.compareBolgeB ?? ''}
          onChange={(e) =>
            onChange({ ...filters, compareBolgeB: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
          İki bölge seçerek piramit ve hane yapısını yan yana karşılaştırın
        </p>
        <Button type="button" size="sm" onClick={onApply}>
          Uygula
        </Button>
      </div>
    </div>
  )
}
