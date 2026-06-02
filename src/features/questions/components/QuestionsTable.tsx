import { RefreshCw, Pencil, Ban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { QuestionDto } from '../types/question.types'

interface QuestionsTableProps {
  data: QuestionDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  onEdit: (question: QuestionDto) => void
  onSetPassive: (question: QuestionDto) => void
  isUpdating: boolean
}

export function QuestionsTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  onEdit,
  onSetPassive,
  isUpdating,
}: QuestionsTableProps) {
  const columns: TableColumn<QuestionDto>[] = [
    {
      key: 'aktif',
      header: 'AKTİF',
      className: 'w-20',
      render: (row) => (
        <span className={row.aktif ? 'font-medium text-primary-600' : 'text-muted'}>
          {row.aktif ? 'Evet' : 'Hayır'}
        </span>
      ),
    },
    {
      key: 'bolumId',
      header: 'BÖLÜM',
      className: 'w-24',
      render: (row) => row.bolumId,
    },
    {
      key: 'id',
      header: 'SORU ID',
      className: 'w-24',
      render: (row) => row.id,
    },
    {
      key: 'soruMetni',
      header: 'SORU METNİ',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs" title={row.soruMetni}>
          {row.soruMetni}
        </span>
      ),
    },
    {
      key: 'cevapGirdiTipId',
      header: 'CEVAP TİPİ',
      className: 'w-28',
      render: (row) => row.cevapGirdiTipId,
    },
    {
      key: 'zorunlu',
      header: 'ZORUNLU',
      className: 'w-24',
      render: (row) => (row.zorunlu ? 'Evet' : 'Hayır'),
    },
    {
      key: 'bagliSoru',
      header: 'BAĞLI',
      className: 'w-24',
      render: (row) => (row.bagliSoru ? 'Evet' : 'Hayır'),
    },
    {
      key: 'actions',
      header: 'İŞLEMLER',
      className: 'w-36',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Düzenle"
            disabled={isUpdating}
            onClick={() => onEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Pasife Al"
            disabled={isUpdating || !row.aktif}
            onClick={() => onSetPassive(row)}
            title={row.aktif ? 'Pasife al' : 'Zaten pasif'}
          >
            <Ban className="h-4 w-4 text-amber-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Sorular</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      {isError ? (
        <ErrorState
          error={error}
          title="Sorular yüklenemedi"
          onRetry={onRefresh}
          compact
        />
      ) : (
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
          emptyMessage="Henüz soru yok."
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  )
}
