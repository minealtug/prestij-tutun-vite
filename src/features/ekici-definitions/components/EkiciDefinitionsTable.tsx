import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { cn } from '@/lib/utils/cn'
import type { EkiciDefinitionDto } from '../types/ekici-definition.types'
import { formatEkiciDisplayText, getEkiciFullNameDisplay } from '../utils/format-ekici-display-text'

interface EkiciDefinitionsTableProps {
  data: EkiciDefinitionDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  onView?: (ekici: EkiciDefinitionDto) => void
  onEdit?: (ekici: EkiciDefinitionDto) => void
  isUpdating?: boolean
  emptyMessage?: string
}

function renderLocationLabel(value: string | null | undefined, fallbackId?: number) {
  if (value?.trim()) return formatEkiciDisplayText(value)
  if (fallbackId != null && fallbackId > 0) return `#${fallbackId}`
  return '—'
}

const actionButtonClass = '!h-7 !px-2 !text-xs'

function AktifBadge({ aktif }: { aktif: number }) {
  const isActive = aktif === 1
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight',
        isActive
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-border bg-muted/10 text-muted',
      )}
    >
      {isActive ? 'Evet' : 'Hayır'}
    </span>
  )
}

export function EkiciDefinitionsTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  onView,
  onEdit,
  isUpdating = false,
  emptyMessage = 'Henüz ekici kaydı bulunmuyor.',
}: EkiciDefinitionsTableProps) {
  const columns: TableColumn<EkiciDefinitionDto>[] = [
    {
      key: 'ad',
      header: 'Ekici',
      className: 'min-w-[150px]',
      render: (row) => (
        <div className="leading-snug">
          <div className="font-medium text-foreground">{getEkiciFullNameDisplay(row)}</div>
          <div className="text-[11px] text-muted">{row.tcKimlikNo || '—'}</div>
        </div>
      ),
    },
    {
      key: 'yil',
      header: 'Yıl',
      className: 'w-14',
      render: (row) => row.yil || '—',
    },
    {
      key: 'menseiAdi',
      header: 'Menşei',
      className: 'min-w-[90px]',
      render: (row) => renderLocationLabel(row.menseiAdi, row.menseiId),
    },
    {
      key: 'bolgeAdi',
      header: 'Bölge',
      className: 'min-w-[90px]',
      render: (row) => renderLocationLabel(row.bolgeAdi, row.bolgeId),
    },
    {
      key: 'mintikaAdi',
      header: 'Mıntıka',
      className: 'min-w-[90px]',
      render: (row) => renderLocationLabel(row.mintikaAdi, row.mintikaId),
    },
    {
      key: 'alimNoktasiAdi',
      header: 'Alım Noktası',
      className: 'min-w-[100px]',
      render: (row) => renderLocationLabel(row.alimNoktasiAdi, row.alimNoktasiId),
    },
    {
      key: 'koyAdi',
      header: 'Köy',
      className: 'min-w-[80px]',
      render: (row) => renderLocationLabel(row.koyAdi, row.koyId),
    },
    {
      key: 'aktif',
      header: 'Aktif',
      className: 'w-14',
      render: (row) => <AktifBadge aktif={row.aktif} />,
    },
    ...(onView || onEdit
      ? [
          {
            key: 'actions',
            header: 'İşlemler',
            className: 'min-w-[140px]',
            render: (row: EkiciDefinitionDto) => {
              const actionsDisabled = isUpdating

              return (
                <div className="flex flex-wrap gap-1">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={actionButtonClass}
                      disabled={actionsDisabled}
                      onClick={() => onView(row)}
                    >
                      Görüntüle
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={actionButtonClass}
                      disabled={actionsDisabled}
                      onClick={() => onEdit(row)}
                    >
                      Düzenle
                    </Button>
                  )}
                </div>
              )
            },
          },
        ]
      : []),
  ]

  if (isError) {
    return <ErrorState error={error} title="Ekiciler yüklenemedi" onRetry={onRefresh} compact />
  }

  return (
    <Table
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      keyExtractor={(row) => row.id}
      compact
      variant="plain"
      className="!rounded-none !border-0"
      tableClassName="app-table-cols"
      pagination={{ pageSize: 20, pageSizeOptions: [20, 50, 100] }}
    />
  )
}

