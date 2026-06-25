import type { ReactNode } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { cn } from '@/lib/utils/cn'
import { useSurveyResponseDetail } from '../hooks/use-survey-response-detail'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import { exportSurveyResponseAnswersToExcel } from '../utils/export-survey-response-answers-excel'
import { buildSoruCevapTree, flattenSoruCevapTree } from '../utils/map-anket-cevap'

interface SurveyResponseAnswersPanelProps {
  ekiciId: string
  sablonId: number
  baslikId?: number
  kategoriAdi?: string
  ekiciAdi?: string
  anketAdi?: string
  enabled: boolean
  columnBorders?: boolean
}

function DetailPanelShell({
  children,
  onExport,
  exportDisabled = false,
}: {
  children: ReactNode
  onExport?: () => void
  exportDisabled?: boolean
}) {
  return (
    <div className="bg-[#f5f8fb] px-4 py-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4f6580] underline">
          Anket cevapları
        </p>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            className="border-green-600 bg-transparent text-green-700 hover:bg-green-50"
            onClick={(event) => {
              event.stopPropagation()
              onExport()
            }}
            disabled={exportDisabled}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            Cevapları Excel'e Aktar
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}

export function SurveyResponseAnswersPanel({
  ekiciId,
  sablonId,
  baslikId,
  kategoriAdi = 'Genel',
  ekiciAdi,
  anketAdi,
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

  const handleExportExcel = () => {
    if (rows.length === 0) return

    exportSurveyResponseAnswersToExcel(rows, {
      ekiciAdi,
      anketAdi,
    })
  }

  if (rows.length === 0) {
    return (
      <DetailPanelShell>
        <p className="text-sm text-muted">Gösterilecek soru yok.</p>
      </DetailPanelShell>
    )
  }

  return (
    <DetailPanelShell onExport={handleExportExcel}>
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
