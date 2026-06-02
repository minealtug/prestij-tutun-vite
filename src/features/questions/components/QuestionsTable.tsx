import { RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { getAnswerTypeLabel } from '../utils/labels'
import type { QuestionDto } from '../types/question.types'

interface QuestionsTableProps {
  data: QuestionDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
}

const columns: TableColumn<QuestionDto>[] = [
  {
    key: 'isActive',
    header: 'AKTİF',
    className: 'w-20',
    render: (row) => (
      <span
        className={
          row.isActive ? 'font-medium text-primary-600' : 'text-muted'
        }
      >
        {row.isActive ? 'Evet' : 'Hayır'}
      </span>
    ),
  },
  {
    key: 'surveyName',
    header: 'ANKET',
    render: (row) => <span className="font-medium">{row.surveyName}</span>,
  },
  {
    key: 'questionNo',
    header: 'SORU NO',
    className: 'w-24',
    render: (row) => row.questionNo,
  },
  {
    key: 'category',
    header: 'KATEGORİ',
    render: (row) => row.category,
  },
  {
    key: 'questionText',
    header: 'SORU',
    render: (row) => (
      <span className="line-clamp-2 max-w-xs" title={row.questionText}>
        {row.questionText}
      </span>
    ),
  },
  {
    key: 'answerType',
    header: 'CEVAP TİPİ',
    render: (row) => getAnswerTypeLabel(row.answerType),
  },
  {
    key: 'linkedCondition',
    header: 'BAĞLI KOŞUL',
    render: (row) => row.linkedCondition ?? '—',
  },
  {
    key: 'actions',
    header: 'İŞLEMLER',
    className: 'w-28',
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" aria-label="Düzenle" disabled title="API hazır olunca">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Sil" disabled title="API hazır olunca">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    ),
  },
]

export function QuestionsTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
}: QuestionsTableProps) {
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
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="Henüz soru yok."
        />
      )}
    </div>
  )
}
