import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useMintikaCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useMySurveyResponses } from '@/features/survey-responses/hooks/use-survey-responses'
import { filterAnketCevapList } from '@/features/survey-responses/utils/filter-anket-cevap-list'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useAuthStore } from '@/stores/auth-store'
import { MyEkicilerTable } from '../components/MyEkicilerTable'
import { useMyEkiciler } from '../hooks/use-ekici-definitions'
import type { EkiciDefinitionDto } from '../types/ekici-definition.types'
import { getEkiciFullName } from '../utils/normalize-ekici-definition-api'
import { buildMyEkiciTableRows, getLatestCevapForEkici } from '../utils/merge-ekici-anket-counts'
import { DEFAULT_EKICILERIM_ANKET_BASLIK_ID } from '../utils/ekici-anket-durumu'
import { buildSurveyFillLinkFromEkici } from '@/features/survey-fill/utils/survey-fill-navigation'
import type { MyEkiciTableRow } from '../components/MyEkicilerTable'
import { exportMyEkicilerToExcel } from '../utils/export-my-ekiciler-excel'

type AktifFilter = 'all' | 'aktif' | 'pasif'

const AKTIF_FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'pasif', label: 'Pasif' },
] as const

function matchesAktifFilter(ekici: EkiciDefinitionDto, filter: AktifFilter) {
  if (filter === 'aktif') return ekici.aktif === 1
  if (filter === 'pasif') return ekici.aktif !== 1
  return true
}

function matchesEkiciSearch(ekici: EkiciDefinitionDto, query: string) {
  const fields = [
    getEkiciFullName(ekici),
    ekici.tcKimlikNo,
    ekici.ad,
    ekici.soyad,
    ekici.babaAdi,
    String(ekici.yil),
    ekici.menseiAdi,
    ekici.bolgeAdi,
    ekici.mintikaAdi,
    ekici.alimNoktasiAdi,
    ekici.koyAdi,
    ekici.makineKodu,
    ekici.aktif === 1 ? 'evet' : 'hayır',
  ]

  return fields
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase('tr-TR').includes(query))
}

export function EkicilerimPage() {
  const navigate = useNavigate()
  const { canRead, loading: permissionLoading } = useRequirePagePermission()
  const userId = useAuthStore((state) => state.user?.id)
  const userMintikaId = useAuthStore((state) => state.user?.mintikaId)
  const hasUserMintika = Boolean(userMintikaId && userMintikaId > 0)
  const cografiFiltreQuery = useMintikaCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)
  const ekicilerQuery = useMyEkiciler(geoCascade.queryParams, {
    requireMintika: hasUserMintika,
  })
  const surveysQuery = useSurveys()
  const cevaplarQuery = useMySurveyResponses(userId)

  const [search, setSearch] = useState('')
  const [aktifFilter, setAktifFilter] = useState<AktifFilter>('all')
  const [selectedBaslikId, setSelectedBaslikId] = useState(DEFAULT_EKICILERIM_ANKET_BASLIK_ID)

  const anketSelected = selectedBaslikId.trim().length > 0
  const selectedBaslikIdNum = Number(selectedBaslikId)
  const hasGeoFilter = Boolean(
    geoCascade.queryParams.menseiId ||
      geoCascade.queryParams.bolgeId ||
      geoCascade.queryParams.mintikaId ||
      geoCascade.queryParams.alimNoktasiId ||
      geoCascade.queryParams.koyId,
  )
  const hasAktifFilter = aktifFilter !== 'all'

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

  const filteredCevaplar = useMemo(() => {
    if (!anketSelected || !Number.isFinite(selectedBaslikIdNum) || selectedBaslikIdNum <= 0) {
      return []
    }
    return filterAnketCevapList(cevaplarQuery.data ?? [], { baslikId: selectedBaslikIdNum })
  }, [anketSelected, cevaplarQuery.data, selectedBaslikIdNum])

  const tableRows = useMemo(() => {
    const ekiciler = ekicilerQuery.data ?? []
    const query = search.trim().toLocaleLowerCase('tr-TR')
    const filteredEkiciler = ekiciler.filter((ekici) => {
      if (!matchesAktifFilter(ekici, aktifFilter)) return false
      if (query && !matchesEkiciSearch(ekici, query)) return false
      return true
    })

    return buildMyEkiciTableRows(filteredEkiciler, filteredCevaplar, anketSelected)
  }, [aktifFilter, anketSelected, ekicilerQuery.data, filteredCevaplar, search])

  const tableEmptyMessage =
    search.trim().length > 0 || hasGeoFilter || hasAktifFilter
      ? 'Arama kriterlerinize uygun ekici kaydı bulunamadı.'
      : hasUserMintika
        ? 'Mıntıkanızda kayıtlı ekici bulunmuyor.'
        : 'Kayıtlı ekici bulunmuyor.'

  const selectedSurveyName = useMemo(() => {
    if (!anketSelected) return undefined
    return anketOptions.find((option) => option.value === selectedBaslikId)?.label
  }, [anketOptions, anketSelected, selectedBaslikId])

  const isLoading =
    cografiFiltreQuery.isLoading ||
    ekicilerQuery.isLoading ||
    cevaplarQuery.isLoading ||
    surveysQuery.isLoading
  const isError = cografiFiltreQuery.isError || ekicilerQuery.isError || cevaplarQuery.isError

  const handleRowDoubleClick = (row: MyEkiciTableRow) => {
    if (!anketSelected || !Number.isFinite(selectedBaslikIdNum) || selectedBaslikIdNum <= 0) {
      return
    }

    const latestCevap = getLatestCevapForEkici(row.id, filteredCevaplar)
    navigate(
      buildSurveyFillLinkFromEkici({
        baslikId: selectedBaslikIdNum,
        sablonId: latestCevap?.sablonId,
        ekici: row,
      }),
    )
  }

  const handleExportExcel = () => {
    if (tableRows.length === 0) return

    exportMyEkicilerToExcel(tableRows, {
      anketSelected,
      surveyName: selectedSurveyName,
    })
  }

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler kontrol ediliyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  if (!userId) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="app-table-shell !rounded-md">
        <div className="flex flex-col gap-3 border-b border-[#ececec] px-4 py-3">
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

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1 sm:max-w-xs">
                <Select
                  label="Anket"
                  value={selectedBaslikId}
                  onChange={(e) => setSelectedBaslikId(e.target.value)}
                  options={anketOptions}
                  disabled={surveysQuery.isLoading}
                />
              </div>
              <div className="min-w-0 w-full sm:max-w-[9.5rem]">
                <Select
                  label="Durum"
                  value={aktifFilter}
                  onChange={(e) => setAktifFilter(e.target.value as AktifFilter)}
                  options={[...AKTIF_FILTER_OPTIONS]}
                />
              </div>
              <div className="min-w-0 flex-1 sm:max-w-lg">
                <Input
                  className="!h-9"
                  placeholder="Ad, soyad, TC, bölge, mıntıka, köy..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Ekici ara"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-green-600 bg-transparent text-green-700 hover:bg-green-50"
              onClick={handleExportExcel}
              disabled={isLoading || tableRows.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Excel'e Aktar
            </Button>
          </div>
        </div>

        <MyEkicilerTable
          data={tableRows}
          isLoading={isLoading}
          isError={isError}
          error={cografiFiltreQuery.error ?? ekicilerQuery.error ?? cevaplarQuery.error}
          onRefresh={() => {
            void cografiFiltreQuery.refetch()
            void ekicilerQuery.refetch()
            void cevaplarQuery.refetch()
            void surveysQuery.refetch()
          }}
          emptyMessage={tableEmptyMessage}
          anketSelected={anketSelected}
          onRowDoubleClick={anketSelected ? handleRowDoubleClick : undefined}
        />
      </div>
    </PageContainer>
  )
}
