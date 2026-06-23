import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { SecenekGrupDto } from '../types/option-group.types'
import {
  formatAltSecenekNames,
  getSecenekGrupDisplayName,
} from '../utils/normalize-option-group-api'

interface OptionGroupsTableProps {
  data: SecenekGrupDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  onEdit?: (grup: SecenekGrupDto) => void
}

export function OptionGroupsTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  onEdit,
}: OptionGroupsTableProps) {
  const columns: TableColumn<SecenekGrupDto>[] = [
    {
      key: 'grup',
      header: 'Grup',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{getSecenekGrupDisplayName(row)}</p>
          {row.grupAdi.trim() && row.altSecenekler.length > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              {formatAltSecenekNames(row.altSecenekler)}
            </p>
          )}
        </div>
      ),
    },
    ...(onEdit
      ? [
          {
            key: 'actions',
            header: 'İşlemler',
            className: 'w-36 text-center',
            render: (row: SecenekGrupDto) => (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Düzenle"
                  onClick={() => onEdit(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ),
          } satisfies TableColumn<SecenekGrupDto>,
        ]
      : []),
  ]

  return (
    <div className="app-table-shell">
      {isError ? (
        <div className="p-4">
          <ErrorState
            error={error}
            title="Seçenek grupları yüklenemedi"
            onRetry={onRefresh}
            compact
          />
        </div>
      ) : (
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => String(row.secenekGrupId)}
          isLoading={isLoading}
          emptyMessage="Henüz seçenek grubu yok. Üstten yeni seçenek listesi ekleyebilirsiniz."
          variant="plain"
          className="!rounded-none !border-0 bg-white"
          tableClassName="app-table-cols"
        />
      )}
    </div>
  )
}
