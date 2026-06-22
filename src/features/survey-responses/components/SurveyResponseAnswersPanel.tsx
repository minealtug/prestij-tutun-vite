import type { ReactNode } from 'react'
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
  columnBorders?: boolean
}

function DetailPanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#f5f8fb] px-4 py-3">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#4f6580] underline">
        Anket cevapları
      </p>
      {children}
    </div>
  )
}

export function SurveyResponseAnswersPanel({
  ekiciId,
  sablonId,
  baslikId,
  kategoriAdi = 'Genel',
  enabled,
  columnBorders = false,
}: SurveyResponseAnswersPanelProps) {
  const detailQuery = useSurveyResponseDetail(ekiciId, sablonId, enabled, baslikId)

  if (detailQuery.isLoading) {
    return (
      <DetailPanelShell>
        <div className="space-y-2 rounded-md border border-[#dce3ec] bg-white p-3">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      </DetailPanelShell>
    )
  }

  if (detailQuery.isError) {
    return (
      <DetailPanelShell>
        <div className="rounded-md border border-[#dce3ec] bg-white p-3">
          <ErrorState
            error={detailQuery.error}
            title="Sorular yüklenemedi"
            onRetry={() => void detailQuery.refetch()}
            compact
          />
        </div>
      </DetailPanelShell>
    )
  }

  const detail = detailQuery.data
  if (!detail) {
    return (
      <DetailPanelShell>
        <p className="text-sm text-muted">Gösterilecek soru yok.</p>
      </DetailPanelShell>
    )
  }

  const rows = flattenSoruCevapTree(buildSoruCevapTree(detail.sorular), kategoriAdi)

  if (rows.length === 0) {
    return (
      <DetailPanelShell>
        <p className="text-sm text-muted">Gösterilecek soru yok.</p>
      </DetailPanelShell>
    )
  }

  return (
    <DetailPanelShell>
      <div className="overflow-hidden rounded-md border border-[#dce3ec] bg-white">
        <table
          className={cn('app-table-nested', columnBorders && 'app-table-cols')}
        >
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[42%]" />
            <col className="w-[40%]" />
          </colgroup>
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Soru</th>
              <th>Cevap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const normalizedCevap = row.cevapMetni?.trim() ?? ''
              const isUnanswered =
                !row.yanitlandi ||
                normalizedCevap === UNANSWERED_ANSWER_LABEL ||
                normalizedCevap === '' ||
                normalizedCevap === '-'
              const cevapMetni = isUnanswered ? UNANSWERED_ANSWER_LABEL : row.cevapMetni

              return (
                <tr key={`${ekiciId}-${sablonId}-${row.soruId}`}>
                  <td>{row.kategori}</td>
                  <td className="font-medium text-foreground">{row.soruMetni}</td>
                  <td>
                    {isUnanswered ? (
                      <span className="text-red-600">{cevapMetni}</span>
                    ) : (
                      cevapMetni
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </DetailPanelShell>
  )
}
