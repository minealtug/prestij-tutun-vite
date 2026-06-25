import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { cn } from '@/lib/utils/cn'
import type { EkiciDefinitionDto } from '../types/ekici-definition.types'
import { formatEkiciDisplayText, getEkiciFullNameDisplay } from '../utils/format-ekici-display-text'
import {
  getEkiciAnketRowClassName,
  type EkiciAnketDurumu,
} from '../utils/ekici-anket-durumu'

export interface MyEkiciTableRow extends EkiciDefinitionDto {
  yanitlananSoruSayisi: number | null
  yanitlanmayanSoruSayisi: number | null
  anketDurumu: EkiciAnketDurumu
}

interface MyEkicilerTableProps {
  data: MyEkiciTableRow[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  emptyMessage?: string
  anketSelected?: boolean
  onRowDoubleClick?: (row: MyEkiciTableRow) => void
}

function renderLocationLabel(value: string | null | undefined, fallbackId?: number) {
  if (value?.trim()) return formatEkiciDisplayText(value)
  if (fallbackId != null && fallbackId > 0) return `#${fallbackId}`
  return '—'
}

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

function formatCount(value: number | null, anketSelected: boolean) {
  if (!anketSelected || value == null) return '—'
  return Math.max(0, value).toLocaleString('tr-TR')
}

export function MyEkicilerTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  emptyMessage = 'Henüz ekici kaydı bulunmuyor.',
  anketSelected = false,
  onRowDoubleClick,
}: MyEkicilerTableProps) {
  const columns: TableColumn<MyEkiciTableRow>[] = [
    {
      key: 'ad',
      header: 'Ekici',
      className: 'min-w-[150px]',
      render: (row) => (
        <div
          className={cn(
            'leading-snug',
            row.aktif !== 1 && 'border-l-2 border-red-500 pl-2',
          )}
        >
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
    {
      key: 'yanitlanan',
      header: 'Yanıtlanan',
      className: 'w-24 text-right',
      render: (row) => formatCount(row.yanitlananSoruSayisi, anketSelected),
    },
    {
      key: 'yanitlanmayan',
      header: 'Yanıtlanmayan',
      className: 'w-28 text-right',
      render: (row) => formatCount(row.yanitlanmayanSoruSayisi, anketSelected),
    },
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
      getRowClassName={(row) =>
        cn(getEkiciAnketRowClassName(row.anketDurumu), onRowDoubleClick && 'select-none')
      }
      onRowDoubleClick={onRowDoubleClick}
    />
  )
}
