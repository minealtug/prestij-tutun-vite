import { Pencil, Ban, Trash2, ChevronUp, ChevronDown, CornerDownRight } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAnswerUnits } from '@/features/answer-units/hooks/use-answer-units'
import { cn } from '@/lib/utils/cn'
import type { QuestionDto } from '../types/question.types'
import { getFriendlyAnswerTypeLabel } from '../utils/answer-type-label'
import { getBagliKosulTipiLabel } from '../utils/bagli-kosul-tipi'
import { GORUNME_KOSULU_TABLE_HEADER } from '../utils/question-field-labels'
import { resolveQuestionBirimAdi } from '../utils/resolve-question-birim-adi'
import {
  resolveCevapGirdiTipAdi,
  resolveCevapGirdiTipId,
} from '../utils/resolve-question-cevap-girdi-tip'
import {
  getQuestionDisplayMeta,
  type QuestionMoveDirection,
} from '../utils/sort-questions'

function resolveBaslikAdi(row: QuestionDto & { baslik?: { adi?: string | null } }) {
  return row.baslikAdi?.trim() || row.baslik?.adi?.trim() || null
}

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
  onMove?: (question: QuestionDto, direction: QuestionMoveDirection) => void
  getMoveState?: (question: QuestionDto) => { canMoveUp: boolean; canMoveDown: boolean }
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
  onDelete,
  onMove,
  getMoveState,
  isUpdating,
}: QuestionsTableProps) {
  const answerUnitsQuery = useAnswerUnits()
  const unitsById = useMemo(() => {
    const map = new Map<number, string>()
    for (const unit of answerUnitsQuery.data ?? []) {
      map.set(unit.id, unit.adi)
    }
    return map
  }, [answerUnitsQuery.data])
  const displayMeta = useMemo(() => getQuestionDisplayMeta(data), [data])

  const columns: TableColumn<QuestionDto>[] = [
    ...(onMove
      ? [
          {
            key: 'sira',
            header: 'SIRA',
            className: 'w-32',
            render: (row: QuestionDto) => {
              const moveState = getMoveState?.(row) ?? { canMoveUp: false, canMoveDown: false }
              const outline = displayMeta.get(String(row.id))?.outline ?? (row.siraNo != null ? String(row.siraNo) : '—')

              return (
                <div className="flex items-center gap-1">
                  <span className="min-w-8 text-center text-xs font-semibold tabular-nums text-muted">
                    {outline}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-7 !w-7 !p-0"
                    aria-label="Yukarı taşı"
                    disabled={isUpdating || !moveState.canMoveUp}
                    onClick={() => onMove(row, 'up')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-7 !w-7 !p-0"
                    aria-label="Aşağı taşı"
                    disabled={isUpdating || !moveState.canMoveDown}
                    onClick={() => onMove(row, 'down')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )
            },
          } satisfies TableColumn<QuestionDto>,
        ]
      : []),
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
      render: (row) => resolveBaslikAdi(row) ?? '-',
    },
    {
      key: 'soruMetni',
      header: 'SORU METNİ',
      className: 'min-w-[16rem] whitespace-normal sm:min-w-[20rem] lg:min-w-[24rem]',
      render: (row) => {
        const birimAdi = resolveQuestionBirimAdi(row, unitsById)
        const depth = displayMeta.get(String(row.id))?.depth ?? (row.bagliSoru ? 1 : 0)
        const isLinked = row.bagliSoru || depth > 0

        return (
          <div
            className={cn(
              'flex items-start gap-2 whitespace-normal break-words',
              isLinked && 'border-l-2 border-primary-300 py-0.5 pl-2',
            )}
            style={depth > 1 ? { marginLeft: (depth - 1) * 16 } : undefined}
          >
            {isLinked ? (
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                <CornerDownRight className="h-3 w-3" aria-hidden />
                {depth > 1 ? 'Alt bağlı' : 'Bağlı'}
              </span>
            ) : (
              <span className="mt-0.5 inline-flex shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Ana
              </span>
            )}
            <span className={cn('min-w-0', !isLinked && 'font-medium text-foreground')}>
              {row.soruMetni}
              {birimAdi ? <span className="text-muted"> ({birimAdi})</span> : null}
            </span>
          </div>
        )
      },
    },
    {
      key: 'cevapGirdiTipAdi',
      header: 'CEVAP TİPİ',
      className: 'min-w-[8rem] whitespace-normal',
      render: (row) => {
        const cevapTipAdi = resolveCevapGirdiTipAdi(row)
        if (!cevapTipAdi) {
          const cevapTipId = resolveCevapGirdiTipId(row)
          return cevapTipId != null ? String(cevapTipId) : '-'
        }

        const label = getFriendlyAnswerTypeLabel(cevapTipAdi)

        return (
          <span className="whitespace-normal break-words" title={cevapTipAdi}>
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
      render: (row) => (row.bagliSoru ? 'Bağlı' : 'Ana'),
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
    {
      key: 'bagliKosulTipi',
      header: GORUNME_KOSULU_TABLE_HEADER,
      className: 'w-40',
      render: (row) => {
        if (!row.bagliSoru) return '-'
        return getBagliKosulTipiLabel(row.bagliKosulTipi)
      },
    },
    ...(onEdit || onSetPassive || onDelete
      ? [
          {
            key: 'actions',
            header: 'İŞLEMLER',
            className: 'w-36',
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
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-7 !w-7 !p-0"
                    aria-label="Sil"
                    disabled={isUpdating}
                    onClick={() => onDelete(row)}
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
          horizontalScroll
          tableClassName="min-w-[72rem] app-table-cols"
          variant="plain"
          compact
          className="!rounded-none !border-0"
          pagination={{ pageSize: 110, pageSizeOptions: [110, 150, 200] }}
          getRowClassName={(row) =>
            row.bagliSoru || (displayMeta.get(String(row.id))?.depth ?? 0) > 0
              ? 'app-table-row--linked'
              : undefined
          }
        />
      )}
    </div>
  )
}
