import { cn } from '@/lib/utils/cn'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { useSurveyResponseDetail } from '../hooks/use-survey-response-detail'
import type { SoruCevapDisplay } from '../types/survey-response.types'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import { buildSoruCevapTree } from '../utils/map-anket-cevap'

interface SurveyResponseAnswersPanelProps {
  ekiciId: string
  sablonId: number
  enabled: boolean
}

function SoruCevapBlock({
  soru,
  depth,
  rowKey,
}: {
  soru: SoruCevapDisplay
  depth: number
  rowKey: string
}) {
  const isChild = depth > 0

  return (
    <div
      className={cn(
        isChild && 'ml-4 border-l-2 border-primary-300/60 pl-4',
        !isChild && 'border-b border-border/50 pb-3',
      )}
    >
      {isChild ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Bağlı soru</p>
      ) : (
        <p className="text-xs font-medium text-primary-600">Soru {soru.sira}</p>
      )}
      <p className={cn('text-sm text-foreground', isChild ? 'mt-1' : 'mt-0.5')}>{soru.soruMetni}</p>
      {soru.altSoruMetni && (
        <p className="mt-0.5 text-xs text-muted">{soru.altSoruMetni}</p>
      )}
      <p
        className={cn(
          'mt-2 rounded-md px-3 py-2 text-sm',
          !soru.yanitlandi ? 'bg-amber-500/10 text-amber-900' : 'bg-primary-500/5 text-foreground',
          isChild && 'text-[0.8125rem]',
        )}
      >
        <span className="font-medium text-muted">Cevap: </span>
        {!soru.yanitlandi ? UNANSWERED_ANSWER_LABEL : soru.cevapMetni}
      </p>

      {soru.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {soru.children.map((child) => (
            <SoruCevapBlock
              key={`${rowKey}-${child.soruId}`}
              soru={child}
              depth={depth + 1}
              rowKey={`${rowKey}-${child.soruId}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SurveyResponseAnswersPanel({
  ekiciId,
  sablonId,
  enabled,
}: SurveyResponseAnswersPanelProps) {
  const detailQuery = useSurveyResponseDetail(ekiciId, sablonId, enabled)

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        error={detailQuery.error}
        title="Sorular yüklenemedi"
        onRetry={() => void detailQuery.refetch()}
        compact
      />
    )
  }

  const detail = detailQuery.data
  if (!detail) {
    return <p className="text-sm text-muted">Gösterilecek soru yok.</p>
  }

  const soruTree = buildSoruCevapTree(detail.sorular)
  const toplamSoru = detail.sorular.length

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        SORULAR VE CEVAPLAR ({toplamSoru} SORU, {detail.yanitlanmayanSoruSayisi} YANITLANMADI)
      </p>
      {soruTree.length === 0 ? (
        <p className="text-sm text-muted">Gösterilecek soru yok.</p>
      ) : (
        <div className="space-y-3">
          {soruTree.map((soru) => (
            <SoruCevapBlock
              key={`${ekiciId}-${sablonId}-${soru.soruId}`}
              soru={soru}
              depth={0}
              rowKey={`${ekiciId}-${sablonId}-${soru.soruId}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
