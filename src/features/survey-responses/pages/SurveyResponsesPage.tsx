import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Snackbar } from '@/components/feedback/Snackbar'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import {
  useCografiFiltreOptions,
  useMintikaCografiFiltreOptions,
} from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import {
  getAlimNoktalariForMintika,
  getBolgelerForMensei,
  getKoylerForAlimNoktasi,
  getMintikalarForBolge,
} from '@/features/cografi-filtre/utils/cografi-filtre'
import { SurveyResponseStatsCards } from '../components/SurveyResponseStatsCards'
import { SurveyResponsesTable } from '../components/SurveyResponsesTable'
import { DeleteSurveyResponsesConfirmModal } from '../components/DeleteSurveyResponsesConfirmModal'
import {
  useAllSurveyResponses,
  useDeleteSurveyResponses,
  useSurveyResponses,
} from '../hooks/use-survey-responses'
import { PageContainer } from '@/components/layout/PageContainer'
import { usePermissions } from '@/features/permissions/hooks/use-permissions'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { userHasMintikaAssignment } from '@/features/users/utils/resolve-mintika-ids'
import { getErrorMessage } from '@/lib/api/api-error'
import { useAuthStore } from '@/stores/auth-store'
import type { AnketCevapOzetItem, SurveyResponsesQueryParams } from '../types/survey-response.types'
import { hasGeoSurveyFilter } from '../types/survey-response.types'
import { matchesEkiciAdSoyadSearch } from '../utils/filter-anket-cevap-list'
import { formatAppliedFilterSummary } from '../utils/format-applied-filter-summary'
import {
  formatDeleteAnketCevapSuccessText,
  toDeleteAnketCevapRequests,
} from '../utils/delete-survey-responses'

const EMPTY_ROWS: AnketCevapOzetItem[] = []

export function SurveyResponsesPage() {
  const { canRead, loading: pagePermissionLoading } = useRequirePagePermission()
  const { isAdmin, loading: permissionLoading, hasAssignedWrite } = usePermissions()
  const canEditAnsweredSurveys = hasAssignedWrite('/anket-cevaplari')
  const authUser = useAuthStore((s) => s.user)
  const hasMintikaAssignment = userHasMintikaAssignment(authUser ?? {})
  const permissionsReady = !permissionLoading && !pagePermissionLoading

  const globalOptionsQuery = useCografiFiltreOptions(permissionsReady && isAdmin)
  const mintikaOptionsQuery = useMintikaCografiFiltreOptions(
    permissionsReady && !isAdmin && hasMintikaAssignment,
  )
  const cografiFiltreQuery = isAdmin ? globalOptionsQuery : mintikaOptionsQuery

  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)

  const [appliedFilters, setAppliedFilters] = useState<SurveyResponsesQueryParams | null>(null)
  const [appliedFilterSummary, setAppliedFilterSummary] = useState('')
  const [ekiciSearch, setEkiciSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [confirmStep, setConfirmStep] = useState<1 | 2 | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({
    open: false,
    message: '',
    variant: 'success',
  })

  const filterLookups = useMemo(() => {
    const options = cografiFiltreQuery.data
    if (!options) {
      return {
        menseiler: [],
        bolgeler: [],
        mintikalar: [],
        alimNoktalari: [],
        koyler: [],
      }
    }

    const { menseiId, bolgeId, mintikaId, alimNoktasiId } = geoCascade.queryParams

    return {
      menseiler: options.menseiler,
      bolgeler: getBolgelerForMensei(options, menseiId),
      mintikalar: getMintikalarForBolge(options, bolgeId),
      alimNoktalari: getAlimNoktalariForMintika(options, mintikaId),
      koyler: getKoylerForAlimNoktasi(options, alimNoktasiId),
    }
  }, [cografiFiltreQuery.data, geoCascade.queryParams])

  const draftFiltersReady = hasGeoSurveyFilter(geoCascade.queryParams)

  const responsesQuery = useSurveyResponses(appliedFilters ?? undefined)
  const deleteMutation = useDeleteSurveyResponses()
  const filtersReady = isAdmin
    ? hasGeoSurveyFilter(appliedFilters ?? undefined)
    : appliedFilters != null && hasMintikaAssignment
  const ekiciSearchQuery = ekiciSearch.trim()
  const unfilteredSearch = isAdmin && ekiciSearchQuery.length > 0 && !filtersReady
  const allResponsesQuery = useAllSurveyResponses(unfilteredSearch)
  const showList = filtersReady || unfilteredSearch
  const activeQuery = filtersReady ? responsesQuery : allResponsesQuery
  const sourceData = showList ? (activeQuery.data ?? EMPTY_ROWS) : EMPTY_ROWS
  const listData = useMemo(() => {
    if (!ekiciSearchQuery) return sourceData
    return sourceData.filter((item) => matchesEkiciAdSoyadSearch(item, ekiciSearchQuery))
  }, [ekiciSearchQuery, sourceData])
  const statsFilterSummary = useMemo(() => {
    const searchSummary = ekiciSearchQuery ? `Ekici: ${ekiciSearchQuery}` : ''
    return [appliedFilterSummary, searchSummary].filter(Boolean).join(' · ')
  }, [appliedFilterSummary, ekiciSearchQuery])

  const selectedRows = useMemo(
    () => (listData ?? []).filter((row) => selectedIds.has(row.id)),
    [listData, selectedIds],
  )

  const applyFilters = useCallback(
    (params: SurveyResponsesQueryParams) => {
      if (isAdmin && !hasGeoSurveyFilter(params)) return
      if (!isAdmin && !hasMintikaAssignment) return
      setAppliedFilters(params)
      setAppliedFilterSummary(formatAppliedFilterSummary(params, filterLookups))
      setSelectedIds(new Set())
      setConfirmStep(null)
    },
    [filterLookups, hasMintikaAssignment, isAdmin],
  )

  const handleApplyFilters = () => {
    applyFilters(geoCascade.queryParams)
  }

  useEffect(() => {
    if (!permissionsReady || isAdmin) return
    if (!hasMintikaAssignment) return
    applyFilters(geoCascade.queryParams)
  }, [
    permissionsReady,
    isAdmin,
    hasMintikaAssignment,
    applyFilters,
    geoCascade.queryParams,
  ])

  useEffect(() => {
    if (!isAdmin) {
      setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()))
      return
    }

    const validIds = new Set((listData ?? []).map((row) => row.id))
    setSelectedIds((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (validIds.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [isAdmin, listData])

  const handleToggleRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const handleToggleAll = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }, [])

  const closeConfirm = () => {
    if (deleteMutation.isPending) return
    setConfirmStep(null)
    deleteMutation.reset()
  }

  const handleConfirmDelete = () => {
    if (!isAdmin || selectedRows.length === 0) return

    const payloads = toDeleteAnketCevapRequests(selectedRows)
    if (payloads.length === 0) return

    deleteMutation.mutate(payloads, {
      onSuccess: (result) => {
        setConfirmStep(null)
        setSelectedIds(new Set())
        setSnackbar({
          open: true,
          message: formatDeleteAnketCevapSuccessText(result),
          variant: 'success',
        })
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: getErrorMessage(error),
          variant: 'error',
        })
      },
    })
  }

  if (pagePermissionLoading || permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler kontrol ediliyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  return (
    <PageContainer>
      {showList && (
        <SurveyResponseStatsCards
          data={listData}
          filterSummary={statsFilterSummary}
          isLoading={activeQuery.isLoading}
        />
      )}

      <Card className="overflow-hidden !rounded-md !p-0" interactive={false}>
        <div className="p-5">
          <CografiFiltreFields
            values={geoCascade.values}
            selectOptions={geoCascade.selectOptions}
            lockedLevels={isAdmin ? undefined : geoCascade.lockedLevels}
            disabled={cografiFiltreQuery.isLoading}
            onMenseiChange={geoCascade.setMenseiId}
            onBolgeChange={geoCascade.setBolgeId}
            onMintikaChange={geoCascade.setMintikaId}
            onAlimNoktasiChange={geoCascade.setAlimNoktasiId}
            onKoyChange={geoCascade.setKoyId}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[#ececec] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              className="!h-9 pl-9"
              placeholder="Ekici ara"
              value={ekiciSearch}
              onChange={(event) => setEkiciSearch(event.target.value)}
              aria-label="Ekici ara"
            />
          </div>
          {isAdmin && (
            <Button
              onClick={handleApplyFilters}
              disabled={!draftFiltersReady}
              loading={responsesQuery.isFetching && filtersReady}
            >
              <Filter className="h-4 w-4" />
              Filtrele
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden !rounded-md !p-0" interactive={false}>
        {!showList ? (
          <p className="px-5 py-5 text-sm text-muted">
            {isAdmin
              ? "Listelemek için ekici adı soyadı yazın ya da en az bir coğrafi filtre seçip Filtrele'ye tıklayın."
              : !hasMintikaAssignment
                ? 'Atanmış mıntıka bulunamadı. Anket listesi için kullanıcıya mıntıka yetkisi verilmelidir.'
                : cografiFiltreQuery.isLoading
                  ? 'Mıntıka filtreleri yükleniyor…'
                  : 'Mıntıka bilgisi yüklenemedi veya tanımlı değil.'}
          </p>
        ) : (
          <>
            {isAdmin && selectedRows.length > 0 && (
              <div className="flex justify-end border-b border-[#ececec] px-4 py-3">
                <Button
                  variant="danger"
                  onClick={() => {
                    deleteMutation.reset()
                    setConfirmStep(1)
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Seçilen ekicilerin anket cevaplarını sil
                </Button>
              </div>
            )}
            <SurveyResponsesTable
              data={listData}
              isLoading={activeQuery.isLoading}
              isError={activeQuery.isError}
              error={activeQuery.error}
              onRefresh={() => void activeQuery.refetch()}
              selectable={isAdmin}
              selectedIds={isAdmin ? selectedIds : undefined}
              onToggleRow={isAdmin ? handleToggleRow : undefined}
              onToggleAll={isAdmin ? handleToggleAll : undefined}
              canEditRow={canEditAnsweredSurveys}
            />
          </>
        )}
      </Card>

      {isAdmin && (
        <>
          <DeleteSurveyResponsesConfirmModal
            open={confirmStep === 1}
            step={1}
            rows={selectedRows}
            onClose={closeConfirm}
            onConfirm={() => setConfirmStep(2)}
          />
          <DeleteSurveyResponsesConfirmModal
            open={confirmStep === 2}
            step={2}
            rows={selectedRows}
            loading={deleteMutation.isPending}
            error={deleteMutation.error}
            onClose={closeConfirm}
            onConfirm={handleConfirmDelete}
          />
          <Snackbar
            open={snackbar.open}
            message={snackbar.message}
            variant={snackbar.variant}
            onClose={closeSnackbar}
          />
        </>
      )}
    </PageContainer>
  )
}
