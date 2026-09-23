import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, Filter } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import {
  useCografiFiltreOptions,
  useMintikaCografiFiltreOptions,
} from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { usePermissions } from '@/features/permissions/hooks/use-permissions'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { userHasMintikaAssignment } from '@/features/users/utils/resolve-mintika-ids'
import { useAuthStore } from '@/stores/auth-store'

import { ColumnHeaderFilter } from '../components/ColumnHeaderFilter'
import { FIXED_COLUMNS } from '../config/anket-cevaplari'
import { useAnketCevaplariReport } from '../hooks/use-anket-cevaplari-report'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import {
  applyColumnHeaderFilters,
  HEADER_FILTER_KEYS,
  isHeaderFilterKey,
  rowsForColumnOptions,
  uniqueColumnValues,
  type ColumnHeaderFilters,
  type HeaderFilterKey,
} from '../utils/column-header-filters'
import { exportAnketCevaplariToExcel } from '../utils/export-anket-cevaplari-excel'
import { formatAnketCevapCell } from '../utils/format-anket-cevap-cell'
import { filterAnketCevapRows } from '../utils/filter-anket-cevaplari'
import { getVisibleSoruKolonlari } from '../utils/visible-soru-kolonlari'

export function AnketCevaplariReportPage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()
  const { isAdmin, loading: adminPermissionLoading } = usePermissions()
  const authUser = useAuthStore((s) => s.user)
  const hasMintikaAssignment = userHasMintikaAssignment(authUser ?? {})
  const permissionsReady = !permissionLoading && !adminPermissionLoading

  const globalOptionsQuery = useCografiFiltreOptions(permissionsReady && isAdmin)
  const mintikaOptionsQuery = useMintikaCografiFiltreOptions(
    permissionsReady && !isAdmin && hasMintikaAssignment,
  )
  const cografiFiltreQuery = isAdmin ? globalOptionsQuery : mintikaOptionsQuery
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)
  const surveysQuery = useSurveys()
  const [selectedBaslikId, setSelectedBaslikId] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnHeaderFilters>({})
  const [openHeaderFilter, setOpenHeaderFilter] = useState<HeaderFilterKey | null>(null)

  const surveys = surveysQuery.data ?? []
  const isSingleSurvey = surveys.length === 1
  const effectiveBaslikId = selectedBaslikId || (isSingleSurvey ? String(surveys[0].id) : '')

  const anketOptions = useMemo(() => {
    const surveyOptions = surveys
      .map((survey) => ({
        value: String(survey.id),
        label: survey.name.trim() || `Anket #${survey.id}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'))

    if (isSingleSurvey) return surveyOptions
    return [{ value: '', label: 'Anket seçin' }, ...surveyOptions]
  }, [isSingleSurvey, surveys])

  const baslikIdNum = Number(effectiveBaslikId)
  const hasBaslik = Number.isFinite(baslikIdNum) && baslikIdNum > 0
  const reportQuery = useAnketCevaplariReport(
    { baslikId: hasBaslik ? baslikIdNum : undefined },
    { enabled: hasBaslik },
  )

  const report = reportQuery.data
  const geoRows = useMemo(
    () => filterAnketCevapRows(report?.satirlar ?? [], geoCascade.queryParams),
    [geoCascade.queryParams, report?.satirlar],
  )
  const rows = useMemo(
    () => applyColumnHeaderFilters(geoRows, columnFilters),
    [columnFilters, geoRows],
  )
  const uniqueByColumn = useMemo(() => {
    const map = {} as Record<HeaderFilterKey, string[]>
    for (const key of HEADER_FILTER_KEYS) {
      map[key] = uniqueColumnValues(rowsForColumnOptions(geoRows, columnFilters, key), key)
    }
    return map
  }, [columnFilters, geoRows])
  const soruKolonlari = report?.soruKolonlari ?? []
  const visibleSoruKolonlari = useMemo(
    () => getVisibleSoruKolonlari(soruKolonlari),
    [soruKolonlari],
  )

  useEffect(() => {
    setColumnFilters({})
    setOpenHeaderFilter(null)
  }, [effectiveBaslikId])

  const columns = useMemo<TableColumn<AnketCevapRow>[]>(() => {
    const fixed: TableColumn<AnketCevapRow>[] = FIXED_COLUMNS.map((c) => {
      const key = String(c.key)
      return {
        key,
        header: c.header,
        headerContent: isHeaderFilterKey(key) ? (
          <ColumnHeaderFilter
            label={c.header}
            values={uniqueByColumn[key]}
            selected={columnFilters[key]}
            open={openHeaderFilter === key}
            onOpenChange={(open) => setOpenHeaderFilter(open ? key : null)}
            onChange={(next) =>
              setColumnFilters((prev) => {
                const copy = { ...prev }
                if (next !== undefined) copy[key] = next
                else delete copy[key]
                return copy
              })
            }
          />
        ) : undefined,
        render: (row) => String(row[c.key] ?? ''),
        stickyLeft: key === 'adi' || key === 'soyadi',
        className: 'whitespace-nowrap',
      }
    })
    const dynamic: TableColumn<AnketCevapRow>[] = visibleSoruKolonlari.map((col) => ({
      key: `q${col.index}`,
      header: col.header,
      render: (row) => formatAnketCevapCell(col.header, row.cevaplar[col.index]),
      className: 'whitespace-nowrap',
    }))
    return [...fixed, ...dynamic]
  }, [columnFilters, openHeaderFilter, uniqueByColumn, visibleSoruKolonlari])

  if (permissionLoading || adminPermissionLoading) {
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

  const waitingForSurveys = surveysQuery.isLoading && !hasBaslik

  return (
    <PageContainer className="h-full min-h-0 overflow-hidden max-md:h-auto max-md:overflow-visible">
      <Link
        to="/raporlar"
        className="inline-flex w-fit shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tüm raporlar
      </Link>

      <div className="glass-card flex shrink-0 flex-col gap-3 !p-4">
        <div className="min-w-0 sm:max-w-xs">
          <Select
            label="Anket"
            value={effectiveBaslikId}
            onChange={(e) => setSelectedBaslikId(e.target.value)}
            options={anketOptions}
            disabled={surveysQuery.isLoading || isSingleSurvey}
          />
        </div>

        {surveysQuery.isError && (
          <ErrorState
            error={surveysQuery.error}
            title="Anket listesi yüklenemedi"
            onRetry={() => void surveysQuery.refetch()}
            compact
          />
        )}

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
            disabled={!hasBaslik}
            onMenseiChange={geoCascade.setMenseiId}
            onBolgeChange={geoCascade.setBolgeId}
            onMintikaChange={geoCascade.setMintikaId}
            onAlimNoktasiChange={geoCascade.setAlimNoktasiId}
            onKoyChange={geoCascade.setKoyId}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3">
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

      {waitingForSurveys ? (
        <Table
          columns={columns}
          data={[]}
          keyExtractor={(row) => row.rowKey}
          isLoading
          emptyTitle="Kayıt bulunamadı"
          emptyMessage="Seçtiğiniz filtrelere uygun anket cevabı bulunmuyor."
          compact
          stickyHeader
          tableClassName="app-table-cols"
          pagination={{ pageSize: 25 }}
        />
      ) : !hasBaslik ? (
        <div className="glass-card flex flex-col items-center justify-center gap-2 !py-14 text-center">
          <Filter className="h-8 w-8 text-primary-400" aria-hidden />
          <p className="text-sm font-medium text-foreground">Lütfen anket seçiniz</p>
          <p className="max-w-md text-xs text-muted">
            Raporu yüklemek için önce bir anket seçin. Menşei, mıntıka ve diğer kırılımlar yüklenen
            sonuç üzerinde uygulanır.
          </p>
        </div>
      ) : reportQuery.isError ? (
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
          stickyHeader
          tableClassName="app-table-cols"
          pagination={{ pageSize: 25 }}
        />
      )}
    </PageContainer>
  )
}
