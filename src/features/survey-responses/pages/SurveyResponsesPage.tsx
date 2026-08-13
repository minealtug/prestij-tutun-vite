import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
import { useDeleteSurveyResponses, useSurveyResponses } from '../hooks/use-survey-responses'
import { PageContainer } from '@/components/layout/PageContainer'
import { usePermissions } from '@/features/permissions/hooks/use-permissions'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { getErrorMessage } from '@/lib/api/api-error'
import type { SurveyResponsesQueryParams } from '../types/survey-response.types'
import { hasGeoSurveyFilter } from '../types/survey-response.types'
import { formatAppliedFilterSummary } from '../utils/format-applied-filter-summary'
import {
  formatDeleteAnketCevapSuccessText,
  toDeleteAnketCevapRequests,
} from '../utils/delete-survey-responses'

export function SurveyResponsesPage() {
  const { canRead, loading: pagePermissionLoading } = useRequirePagePermission()
  const { isAdmin, loading: permissionLoading } = usePermissions()
  const permissionsReady = !permissionLoading && !pagePermissionLoading

  const globalOptionsQuery = useCografiFiltreOptions(permissionsReady && isAdmin)
  const mintikaOptionsQuery = useMintikaCografiFiltreOptions(permissionsReady && !isAdmin)
  const cografiFiltreQuery = isAdmin ? globalOptionsQuery : mintikaOptionsQuery

  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)

  const [appliedFilters, setAppliedFilters] = useState<SurveyResponsesQueryParams | null>(null)
  const [appliedFilterSummary, setAppliedFilterSummary] = useState('')
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
  const filtersReady = hasGeoSurveyFilter(appliedFilters ?? undefined)
  const listData = responsesQuery.data

  const selectedRows = useMemo(
    () => (listData ?? []).filter((row) => selectedIds.has(row.id)),
    [listData, selectedIds],
  )

  const applyFilters = useCallback(
    (params: SurveyResponsesQueryParams) => {
      if (!hasGeoSurveyFilter(params)) return
      setAppliedFilters(params)
      setAppliedFilterSummary(formatAppliedFilterSummary(params, filterLookups))
      setSelectedIds(new Set())
      setConfirmStep(null)
    },
    [filterLookups],
  )

  const handleApplyFilters = () => {
    applyFilters(geoCascade.queryParams)
  }

  useEffect(() => {
    if (!permissionsReady || isAdmin) return
    if (!draftFiltersReady) return
    applyFilters(geoCascade.queryParams)
  }, [
    permissionsReady,
    isAdmin,
    draftFiltersReady,
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
      {filtersReady && (
        <SurveyResponseStatsCards
          data={responsesQuery.data ?? []}
          filterSummary={appliedFilterSummary}
          isLoading={responsesQuery.isLoading}
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

        {isAdmin && (
          <div className="flex justify-end border-t border-[#ececec] px-4 py-3">
            <Button
              onClick={handleApplyFilters}
              disabled={!draftFiltersReady}
              loading={responsesQuery.isFetching && filtersReady}
            >
              <Filter className="h-4 w-4" />
              Filtrele
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden !rounded-md !p-0" interactive={false}>
        {!filtersReady ? (
          <p className="px-5 py-5 text-sm text-muted">
            {isAdmin
              ? "Listelemek için en az bir coğrafi filtre (menşei, bölge, mıntıka vb.) seçin ve Filtrele'ye tıklayın."
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
              data={listData ?? []}
              isLoading={responsesQuery.isLoading}
              isError={responsesQuery.isError}
              error={responsesQuery.error}
              onRefresh={() => void responsesQuery.refetch()}
              selectable={isAdmin}
              selectedIds={isAdmin ? selectedIds : undefined}
              onToggleRow={isAdmin ? handleToggleRow : undefined}
              onToggleAll={isAdmin ? handleToggleAll : undefined}
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
