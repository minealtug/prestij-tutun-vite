import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useMintikaCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'

import { FIXED_COLUMNS } from '../config/anket-cevaplari'
import { useAnketCevaplariReport } from '../hooks/use-anket-cevaplari-report'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import { exportAnketCevaplariToExcel } from '../utils/export-anket-cevaplari-excel'

export function AnketCevaplariReportPage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()

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
  const reportQuery = useAnketCevaplariReport({
    baslikId: Number.isFinite(baslikIdNum) && baslikIdNum > 0 ? baslikIdNum : undefined,
    ...geoCascade.queryParams,
  })

  const report = reportQuery.data
  const rows = report?.satirlar ?? []
  const soruKolonlari = report?.soruKolonlari ?? []

  const columns = useMemo<TableColumn<AnketCevapRow>[]>(() => {
    const fixed: TableColumn<AnketCevapRow>[] = FIXED_COLUMNS.map((c) => ({
      key: String(c.key),
      header: c.header,
      render: (row) => String(row[c.key] ?? ''),
      className: 'whitespace-nowrap',
    }))
    const dynamic: TableColumn<AnketCevapRow>[] = soruKolonlari.map((q, i) => ({
      key: `q${i}`,
      header: q,
      render: (row) => row.cevaplar[i] ?? '',
      className: 'whitespace-nowrap',
    }))
    return [...fixed, ...dynamic]
  }, [soruKolonlari])

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yükleniyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  const handleExportExcel = () => {
    if (!report || rows.length === 0) return
    exportAnketCevaplariToExcel(soruKolonlari, rows)
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

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Anket Cevap Raporu
          {rows.length > 0 && <span className="ml-2 text-xs text-muted">({rows.length} kayıt)</span>}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-green-600 bg-transparent text-green-700 hover:bg-green-50"
          onClick={handleExportExcel}
          disabled={rows.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          Excel'e Aktar
        </Button>
      </div>

      {reportQuery.isError ? (
        <ErrorState
          error={reportQuery.error}
          title="Rapor yüklenemedi"
          onRetry={() => void reportQuery.refetch()}
        />
      ) : (
        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.rowKey}
          isLoading={reportQuery.isLoading}
          emptyTitle="Kayıt bulunamadı"
          emptyMessage="Seçtiğiniz filtrelere uygun anket cevabı bulunmuyor."
          compact
          tableClassName="app-table-cols"
          pagination={{ pageSize: 25 }}
        />
      )}
    </PageContainer>
  )
}
