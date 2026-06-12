import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { cn } from '@/lib/utils/cn'
import { useSurveyResponseDetail } from '../hooks/use-survey-response-detail'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import { buildSoruCevapTree, flattenSoruCevapTree } from '../utils/map-anket-cevap'

interface SurveyResponseAnswersPanelProps {
  ekiciId: string
  sablonId: number
  baslikId?: number
  kategoriAdi?: string
  enabled: boolean
}

export function SurveyResponseAnswersPanel({
  ekiciId,
  sablonId,
  baslikId,
  kategoriAdi = 'Genel',
  enabled,
}: SurveyResponseAnswersPanelProps) {
  const detailQuery = useSurveyResponseDetail(ekiciId, sablonId, enabled, baslikId)

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-2 px-4 py-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <div className="px-4 py-3">
        <ErrorState
          error={detailQuery.error}
          title="Sorular yüklenemedi"
          onRetry={() => void detailQuery.refetch()}
          compact
        />
      </div>
    )
  }

  const detail = detailQuery.data
  if (!detail) {
    return <p className="px-4 py-3 text-sm text-muted">Gösterilecek soru yok.</p>
  }

  const rows = flattenSoruCevapTree(buildSoruCevapTree(detail.sorular), kategoriAdi)

  if (rows.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted">Gösterilecek soru yok.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              KATEGORİ
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              SORU
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              CEVAP
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${ekiciId}-${sablonId}-${row.soruId}`} className="border-b border-border/40">
              <td className="px-4 py-3 align-top text-foreground">{row.kategori}</td>
              <td className="px-4 py-3 align-top font-semibold text-foreground">{row.soruMetni}</td>
              <td
                className={cn(
                  'px-4 py-3 align-top text-foreground',
                  !row.yanitlandi && 'text-amber-800',
                )}
              >
                {row.yanitlandi ? row.cevapMetni : UNANSWERED_ANSWER_LABEL}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
