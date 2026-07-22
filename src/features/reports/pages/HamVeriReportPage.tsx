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
  AGE_RANGES,
  DATA_COL_COUNT,
  GROUP_COL_COUNT,
  ROW_HEADERS,
  SOURCE_GROUPS,
  TABS,
  TOTAL_COL_COUNT,
  type HamVeriPivotRow,
  type TabKey,
} from '../config/ham-veri-report'
import { exportHamVeriReportToExcel } from '../utils/export-ham-veri-report-excel'

const thBase =
  'border border-border/70 bg-surface px-2 py-1.5 text-center align-middle text-[11px] font-semibold text-foreground whitespace-nowrap'

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

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yükleniyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0]

  // API bağlanana kadar boş; veri geldiğinde bu diziyi doldurun.
  const rows: HamVeriPivotRow[] = []

  const handleExportExcel = () => {
    exportHamVeriReportToExcel(active.title, rows)
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
                  <th key={header} rowSpan={3} className={cn(thBase, 'sticky left-0 z-10 text-left')}>
                    {header}
                  </th>
                ))}
                {SOURCE_GROUPS.map((group) => (
                  <th key={group.key} colSpan={GROUP_COL_COUNT} className={thBase}>
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr>
                {SOURCE_GROUPS.map((group) => (
                  <Fragment key={group.key}>
                    {AGE_RANGES.map((range) => (
                      <Fragment key={`${group.key}-${range}`}>
                        <th colSpan={2} className={thBase}>
                          {range}
                        </th>
                        <th rowSpan={2} className={cn(thBase, 'bg-primary-500/5')}>
                          {range} Toplam
                        </th>
                      </Fragment>
                    ))}
                    <th rowSpan={2} className={cn(thBase, 'bg-primary-500/10')}>
                      {group.totalLabel}
                    </th>
                  </Fragment>
                ))}
              </tr>
              <tr>
                {SOURCE_GROUPS.map((group) =>
                  AGE_RANGES.map((range) => (
                    <Fragment key={`${group.key}-${range}-g`}>
                      <th className={cn(thBase, 'font-medium')}>Erkek</th>
                      <th className={cn(thBase, 'font-medium')}>Kadın</th>
                    </Fragment>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={TOTAL_COL_COUNT} className="border border-border/70 px-4 py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium text-foreground">Henüz veri yok</p>
                    <p className="mt-1 max-w-sm text-xs text-muted">
                      Filtreleri seçip anket bağlandığında dağılım satırları burada
                      listelenecek.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-primary-500/10 font-semibold">
                <td
                  colSpan={ROW_HEADERS.length}
                  className="border border-border/70 px-2 py-1.5 text-left text-[11px] text-foreground"
                >
                  Genel Toplam
                </td>
                {Array.from({ length: DATA_COL_COUNT }).map((_, index) => (
                  <td
                    key={index}
                    className="border border-border/70 px-2 py-1.5 text-center text-[11px] text-muted"
                  >
                    —
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </PageContainer>
  )
}
