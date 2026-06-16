import { RefreshCw, Pencil, Ban, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { QuestionDto } from '../types/question.types'
import { getFriendlyAnswerTypeLabel } from '../utils/answer-type-label'

function getParentQuestionText(value: QuestionDto['bagliOlduguSoru']) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text.length > 0 ? text : null
  }

  if (value && typeof value === 'object') {
    const candidates = ['soruMetni', 'metin', 'adi', 'name', 'title']

    for (const key of candidates) {
      const candidate = value[key]
      if (typeof candidate === 'string') {
        const text = candidate.trim()
        if (text.length > 0) return text
      }
    }
  }

  return null
}

interface QuestionsTableProps {
  data: QuestionDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  onEdit?: (question: QuestionDto) => void
  onSetPassive?: (question: QuestionDto) => void
  onDelete?: (question: QuestionDto) => void
  isUpdating: boolean
  isDeleting: boolean
}

export function QuestionsTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  onEdit,
  onSetPassive,
  onDelete,
  isUpdating,
  isDeleting,
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
      key: 'baslikAdi',
      header: 'BAŞLIK',
      className: 'w-32',
      render: (row) => row.baslikAdi ?? '-',
    },
    {
      key: 'soruMetni',
      header: 'SORU METNİ',
      className: 'w-[60%] min-w-[360px] whitespace-normal',
      render: (row) => (
        <span className="whitespace-normal break-words">{row.soruMetni}</span>
      ),
    },
    {
      key: 'cevapGirdiTipAdi',
      header: 'CEVAP TİPİ',
      className: 'w-36',
      render: (row) => {
        if (!row.cevapGirdiTipAdi) return row.cevapGirdiTipId != null ? row.cevapGirdiTipId : '-'
        const friendly = getFriendlyAnswerTypeLabel(row.cevapGirdiTipAdi)
        const label =
          friendly === row.cevapGirdiTipAdi ? friendly : `${friendly} (${row.cevapGirdiTipAdi})`

        return (
          <span className="block max-w-[200px] truncate" title={label}>
            {label}
          </span>
        )
      },
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
      key: 'bagliOlduguSoru',
      header: 'BAĞLI OLDUĞU SORU',
      className: 'w-56',
      render: (row) => {
        if (!row.bagliSoru) return '-'

        const parentText = getParentQuestionText(row.bagliOlduguSoru)
        if (parentText) {
          return (
            <span className="block max-w-[260px] truncate" title={parentText}>
              {parentText}
            </span>
          )
        }

        return row.bagliOlduguSoruId != null ? `#${row.bagliOlduguSoruId}` : '-'
      },
    },
    ...(onEdit || onSetPassive || onDelete
      ? [
          {
            key: 'actions',
            header: 'İŞLEMLER',
            className: 'w-44',
            render: (row: QuestionDto) => (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Düzenle"
                    disabled={isUpdating}
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onSetPassive && (
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
                )}
                {onDelete && row.kaynak === 'AppDb' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Sil"
                    disabled={isDeleting}
                    onClick={() => onDelete(row)}
                    title="Soruyu sil"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ),
          } satisfies TableColumn<QuestionDto>,
        ]
      : []),
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
          keyExtractor={(row) => `${row.kaynak ?? 'unknown'}-${row.id}`}
          isLoading={isLoading}
          emptyMessage="Henüz soru yok."
          horizontalScroll={false}
          className="!rounded-md"
          pagination={{ pageSize: 25, pageSizeOptions: [10, 25, 50, 100] }}
        />
      )}
    </div>
  )
}
