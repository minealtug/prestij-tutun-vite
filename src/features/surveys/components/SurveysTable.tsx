import { RefreshCw, Pencil, Trash2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { SurveyDto } from '../types/survey.types'

interface SurveysTableProps {
  data: SurveyDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  count: number
  onRefresh: () => void
  onDelete?: (id: string) => void
  isDeleting: boolean
}

export function SurveysTable({
  data,
  isLoading,
  isError,
  error,
  count,
  onRefresh,
  onDelete,
  isDeleting,
}: SurveysTableProps) {
  const columns: TableColumn<SurveyDto>[] = [
    {
      key: 'name',
      header: 'ANKET İSMİ',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    ...(onDelete
      ? [
          {
            key: 'actions',
            header: 'İŞLEMLER',
            className: 'w-28 text-right',
            render: (row: SurveyDto) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" aria-label="Düzenle" disabled title="API hazır olunca">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Sil"
                  disabled={isDeleting}
                  onClick={() => onDelete(row.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ),
          } satisfies TableColumn<SurveyDto>,
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Anketler</h3>
          {!isLoading && !isError && (
            <span className="rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              {count}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      {isError ? (
        <ErrorState
          error={error}
          title="Anketler yüklenemedi"
          onRetry={onRefresh}
          compact
        />
      ) : (
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => `${row.kaynak ?? 'unknown'}-${row.id}`}
          isLoading={isLoading}
          emptyMessage="Henüz anket yok. Soldan yeni anket ekleyebilirsiniz."
        />
      )}
    </div>
  )
}
