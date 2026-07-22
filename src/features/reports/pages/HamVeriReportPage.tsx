import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useMintikaCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { cn } from '@/lib/utils/cn'

import {
  AGE_BANDS,
  DATA_COL_COUNT,
  ROW_HEADERS,
  SOURCE_LABEL,
  SOURCE_TOTAL_LABEL,
  TABS,
  TOTAL_COL_COUNT,
  type TabKey,
} from '../config/ham-veri-report'
import { useEkiciYasCinsiyetReport } from '../hooks/use-ekici-yas-cinsiyet-report'
import type {
  EkiciYasCinsiyetRow,
  EkiciYasCinsiyetTotals,
} from '../types/ekici-yas-cinsiyet.types'
import { exportHamVeriReportToExcel } from '../utils/export-ham-veri-report-excel'

const thBase =
  'border border-border/70 bg-surface px-2 py-1.5 text-center align-middle text-[11px] font-semibold text-foreground whitespace-nowrap'
const tdBase = 'border border-border/70 px-2 py-1.5 text-[11px]'
const tdText = cn(tdBase, 'text-left whitespace-nowrap align-top')
const tdNum = cn(tdBase, 'text-center tabular-nums')

interface RowSpans {
  menseiSpan?: number
  bolgeSpan?: number
  mintikaSpan?: number
}

function computeRowSpans(rows: EkiciYasCinsiyetRow[]): RowSpans[] {
  const keyAt = (i: number, level: 0 | 1 | 2) => {
    const r = rows[i]
    if (level === 0) return r.menseiAd
    if (level === 1) return `${r.menseiAd}¦${r.bolgeAd}`
    return `${r.menseiAd}¦${r.bolgeAd}¦${r.mintikaAd}`
  }
  const spans: RowSpans[] = rows.map(() => ({}))
  const props = ['menseiSpan', 'bolgeSpan', 'mintikaSpan'] as const

  for (let level = 0 as 0 | 1 | 2; level <= 2; level = (level + 1) as 0 | 1 | 2) {
    let i = 0
    while (i < rows.length) {
      let j = i + 1
      while (j < rows.length && keyAt(j, level) === keyAt(i, level)) j += 1
      spans[i][props[level]] = j - i
      i = j
    }
  }
  return spans
}

function fmt(value: number): string {
  return value ? value.toLocaleString('tr-TR') : ''
}

function TotalsCells({ totals, strong }: { totals: EkiciYasCinsiyetTotals; strong?: boolean }) {
  return (
    <>
      {AGE_BANDS.map((band) => {
        const v = totals[band.key]
        return (
          <Fragment key={band.key}>
            <td className={cn(tdNum, strong && 'font-semibold')}>{fmt(v.erkek)}</td>
            <td className={cn(tdNum, strong && 'font-semibold')}>{fmt(v.kadin)}</td>
            <td className={cn(tdNum, 'bg-primary-500/5 font-medium', strong && 'font-semibold')}>
              {fmt(v.toplam)}
            </td>
          </Fragment>
        )
      })}
      <td className={cn(tdNum, 'bg-primary-500/10 font-semibold')}>
        {fmt(totals.sozlesmeliEkiciToplam)}
      </td>
    </>
  )
}

export function HamVeriReportPage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()
  const [activeTab, setActiveTab] = useState<TabKey>('ekici')

  const cografiFiltreQuery = useMintikaCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)
  const surveysQuery = useSurveys()
  const [selectedBaslikId, setSelectedBaslikId] = useState('')

  const anketOptions = useMemo(() => {
    const surveys = surveysQuery.data ?? []
    return [
      { value: '', label: 'Anket seçin' },
      ...surveys
        .map((survey) => ({
          value: String(survey.id),
          label: survey.name.trim() || `Anket #${survey.id}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'tr-TR')),
    ]
  }, [surveysQuery.data])

  const baslikIdNum = Number(selectedBaslikId)
  const isEkiciTab = activeTab === 'ekici'

  const reportQuery = useEkiciYasCinsiyetReport(
    {
      baslikId: Number.isFinite(baslikIdNum) && baslikIdNum > 0 ? baslikIdNum : undefined,
      ...geoCascade.queryParams,
    },
    { enabled: isEkiciTab },
  )

  const report = isEkiciTab ? reportQuery.data : undefined
  const rows = report?.rows ?? []
  const spans = useMemo(() => computeRowSpans(rows), [rows])

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yükleniyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0]

  const handleExportExcel = () => {
    if (!report) return
    exportHamVeriReportToExcel(active.title, report.rows, report.genelToplam)
  }

  return (
    <PageContainer>
      <Link
        to="/raporlar"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tüm raporlar
      </Link>

      {/* Filtreler */}
      <div className="glass-card flex flex-col gap-3 !p-4">
        {cografiFiltreQuery.isError && (
          <ErrorState
            error={cografiFiltreQuery.error}
            title="Coğrafi filtreler yüklenemedi"
            onRetry={() => void cografiFiltreQuery.refetch()}
            compact
          />
        )}

        {cografiFiltreQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <CografiFiltreFields
            values={geoCascade.values}
            selectOptions={geoCascade.selectOptions}
            lockedLevels={geoCascade.lockedLevels}
            onMenseiChange={geoCascade.setMenseiId}
            onBolgeChange={geoCascade.setBolgeId}
            onMintikaChange={geoCascade.setMintikaId}
            onAlimNoktasiChange={geoCascade.setAlimNoktasiId}
            onKoyChange={geoCascade.setKoyId}
          />
        )}

        <div className="min-w-0 sm:max-w-xs">
          <Select
            label="Anket"
            value={selectedBaslikId}
            onChange={(e) => setSelectedBaslikId(e.target.value)}
            options={anketOptions}
            disabled={surveysQuery.isLoading}
          />
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              '-mb-px rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors',
              tab.key === activeTab
                ? 'border-border bg-surface-elevated text-primary-700'
                : 'border-transparent text-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{active.title}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-green-600 bg-transparent text-green-700 hover:bg-green-50"
            onClick={handleExportExcel}
            disabled={!report || rows.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            Excel'e Aktar
          </Button>
        </div>

        {/* Pivot tablo */}
        <div className="overflow-x-auto scrollbar-visible">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                {ROW_HEADERS.map((header) => (
                  <th key={header} rowSpan={3} className={cn(thBase, 'text-left')}>
                    {header}
                  </th>
                ))}
                <th colSpan={DATA_COL_COUNT} className={thBase}>
                  {SOURCE_LABEL}
                </th>
              </tr>
              <tr>
                {AGE_BANDS.map((band) => (
                  <Fragment key={band.key}>
                    <th colSpan={2} className={thBase}>
                      {band.label}
                    </th>
                    <th rowSpan={2} className={cn(thBase, 'bg-primary-500/5')}>
                      {band.label} Toplam
                    </th>
                  </Fragment>
                ))}
                <th rowSpan={2} className={cn(thBase, 'bg-primary-500/10')}>
                  {SOURCE_TOTAL_LABEL}
                </th>
              </tr>
              <tr>
                {AGE_BANDS.map((band) => (
                  <Fragment key={band.key}>
                    <th className={cn(thBase, 'font-medium')}>Erkek</th>
                    <th className={cn(thBase, 'font-medium')}>Kadın</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isEkiciTab ? (
                <tr>
                  <td colSpan={TOTAL_COL_COUNT} className={cn(tdBase, 'px-4 py-12 text-center')}>
                    <p className="text-sm font-medium text-foreground">
                      Bu rapor için API henüz hazır değil
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {active.label} verileri bağlandığında burada görüntülenecek.
                    </p>
                  </td>
                </tr>
              ) : reportQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={TOTAL_COL_COUNT} className={cn(tdBase, '!py-0')}>
                      <Skeleton className="my-1 h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : reportQuery.isError ? (
                <tr>
                  <td colSpan={TOTAL_COL_COUNT} className={cn(tdBase, 'p-4')}>
                    <ErrorState
                      error={reportQuery.error}
                      title="Rapor yüklenemedi"
                      onRetry={() => void reportQuery.refetch()}
                      compact
                    />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={TOTAL_COL_COUNT} className={cn(tdBase, 'px-4 py-12 text-center')}>
                    <p className="text-sm font-medium text-foreground">Kayıt bulunamadı</p>
                    <p className="mt-1 text-xs text-muted">
                      Seçtiğiniz filtrelere uygun veri bulunmuyor.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.menseiAd}-${row.bolgeAd}-${row.mintikaAd}-${row.alimNoktasiAd}-${i}`}>
                    {spans[i].menseiSpan != null && (
                      <td rowSpan={spans[i].menseiSpan} className={cn(tdText, 'font-medium')}>
                        {row.menseiAd}
                      </td>
                    )}
                    {spans[i].bolgeSpan != null && (
                      <td rowSpan={spans[i].bolgeSpan} className={tdText}>
                        {row.bolgeAd}
                      </td>
                    )}
                    {spans[i].mintikaSpan != null && (
                      <td rowSpan={spans[i].mintikaSpan} className={tdText}>
                        {row.mintikaAd}
                      </td>
                    )}
                    <td className={tdText}>{row.alimNoktasiAd}</td>
                    <TotalsCells totals={row} />
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-primary-500/10 font-semibold">
                <td colSpan={ROW_HEADERS.length} className={cn(tdBase, 'text-left')}>
                  Genel Toplam
                </td>
                {report ? (
                  <TotalsCells totals={report.genelToplam} strong />
                ) : (
                  Array.from({ length: DATA_COL_COUNT }).map((_, index) => (
                    <td key={index} className={cn(tdNum, 'text-muted')}>
                      —
                    </td>
                  ))
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </PageContainer>
  )
}
