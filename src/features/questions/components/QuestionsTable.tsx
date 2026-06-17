import { Pencil, Ban, Trash2 } from 'lucide-react'
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
      className: 'w-56 min-w-[13rem] whitespace-normal',
      render: (row) => {
        if (!row.cevapGirdiTipAdi) return row.cevapGirdiTipId != null ? row.cevapGirdiTipId : '-'
        const friendly = getFriendlyAnswerTypeLabel(row.cevapGirdiTipAdi)
        const label =
          friendly === row.cevapGirdiTipAdi ? friendly : `${friendly} (${row.cevapGirdiTipAdi})`

        return (
          <span className="whitespace-normal break-words" title={label}>
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
            className: 'w-28',
            render: (row: QuestionDto) => (
              <div className="flex gap-0.5">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-7 !w-7 !p-0"
                    aria-label="Düzenle"
                    disabled={isUpdating}
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onSetPassive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-7 !w-7 !p-0"
                    aria-label="Pasife Al"
                    disabled={isUpdating || !row.aktif}
                    onClick={() => onSetPassive(row)}
                    title={row.aktif ? 'Pasife al' : 'Zaten pasif'}
                  >
                    <Ban className="h-3.5 w-3.5 text-amber-600" />
                  </Button>
                )}
                {onDelete && row.kaynak === 'AppDb' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-7 !w-7 !p-0"
                    aria-label="Sil"
                    disabled={isDeleting}
                    onClick={() => onDelete(row)}
                    title="Soruyu sil"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                )}
              </div>
            ),
          } satisfies TableColumn<QuestionDto>,
        ]
      : []),
  ]

  return (
    <div className="app-table-shell">
      {isError ? (
        <div className="p-4">
          <ErrorState
            error={error}
            title="Sorular yüklenemedi"
            onRetry={onRefresh}
            compact
          />
        </div>
      ) : (
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => `${row.kaynak ?? 'unknown'}-${row.id}`}
          isLoading={isLoading}
          emptyMessage="Henüz soru yok."
          horizontalScroll={false}
          variant="plain"
          compact
          className="!rounded-none !border-0"
          pagination={{ pageSize: 25, pageSizeOptions: [10, 25, 50, 100] }}
        />
      )}
    </div>
  )
}
