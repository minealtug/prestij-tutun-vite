import { useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useAuthStore } from '@/stores/auth-store'
import { SurveyResponseStatsCards } from '../components/SurveyResponseStatsCards'
import { SurveyResponsesTable } from '../components/SurveyResponsesTable'
import {
  useAlimNoktalari,
  useBolgeler,
  useKoyler,
  useMenseiler,
  useMintikalar,
} from '../hooks/use-survey-response-filters'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useSurveyResponses } from '../hooks/use-survey-responses'
import { PageContainer } from '@/components/layout/PageContainer'
import type { FilterOptionDto, SurveyResponsesQueryParams } from '../types/survey-response.types'
import { hasAnySurveyFilter } from '../types/survey-response.types'
import { formatAppliedFilterSummary } from '../utils/format-applied-filter-summary'

function toSelectOptions(
  items: FilterOptionDto[],
  placeholder: string,
): { value: string; label: string }[] {
  const options = [{ value: '', label: placeholder }]
  items.forEach((item) => options.push({ value: String(item.id), label: item.adi }))
  return options
}

export function SurveyResponsesPage() {
  const user = useAuthStore((s) => s.user)
  const [baslikId, setBaslikId] = useState('')
  const [menseiId, setMenseiId] = useState('')
  const [bolgeId, setBolgeId] = useState('')
  const [mintikaId, setMintikaId] = useState('')
  const [alimNoktasiId, setAlimNoktasiId] = useState('')
  const [koyId, setKoyId] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<SurveyResponsesQueryParams | null>(null)
  const [appliedFilterSummary, setAppliedFilterSummary] = useState('')

  const baslikIdNum = useMemo(() => {
    const num = Number(baslikId)
    return Number.isFinite(num) && num > 0 ? num : undefined
  }, [baslikId])
  const menseiIdNum = menseiId ? Number(menseiId) : undefined
  const bolgeIdNum = bolgeId ? Number(bolgeId) : undefined
  const mintikaIdNum = mintikaId ? Number(mintikaId) : undefined
  const alimNoktasiIdNum = alimNoktasiId ? Number(alimNoktasiId) : undefined
  const koyIdNum = koyId ? Number(koyId) : undefined

  const anketlerQuery = useSurveys()

  const selectedAnketAdi = useMemo(() => {
    if (!baslikId) return undefined
    return (anketlerQuery.data ?? []).find((survey) => String(survey.id) === baslikId)?.name
  }, [anketlerQuery.data, baslikId])

  const draftFilterParams = useMemo(
    () => ({
      baslikId: baslikIdNum,
      anketAdi: selectedAnketAdi,
      menseiId: menseiIdNum,
      bolgeId: bolgeIdNum,
      mintikaId: mintikaIdNum,
      alimNoktasiId: alimNoktasiIdNum,
      koyId: koyIdNum,
    }),
    [
      baslikIdNum,
      selectedAnketAdi,
      menseiIdNum,
      bolgeIdNum,
      mintikaIdNum,
      alimNoktasiIdNum,
      koyIdNum,
    ],
  )

  const draftFiltersReady = hasAnySurveyFilter(draftFilterParams)

  const menseilerQuery = useMenseiler()
  const bolgelerQuery = useBolgeler(menseiIdNum)
  const mintikalarQuery = useMintikalar(bolgeIdNum)
  const alimNoktalariQuery = useAlimNoktalari(mintikaIdNum)
  const koylerQuery = useKoyler(alimNoktasiIdNum)

  const responsesQuery = useSurveyResponses(appliedFilters ?? undefined)
  const filtersReady = hasAnySurveyFilter(appliedFilters ?? undefined)

  const handleApplyFilters = () => {
    if (!draftFiltersReady) return
    setAppliedFilters(draftFilterParams)
    setAppliedFilterSummary(
      formatAppliedFilterSummary(draftFilterParams, {
        anketler: anketlerQuery.data ?? [],
        menseiler: menseilerQuery.data ?? [],
        bolgeler: bolgelerQuery.data ?? [],
        mintikalar: mintikalarQuery.data ?? [],
        alimNoktalari: alimNoktalariQuery.data ?? [],
        koyler: koylerQuery.data ?? [],
      }),
    )
  }

  const anketOptions = useMemo(() => {
    const options = [{ value: '', label: 'Anket seçin' }]
    for (const survey of anketlerQuery.data ?? []) {
      options.push({ value: String(survey.id), label: survey.name })
    }
    return options
  }, [anketlerQuery.data])

  const menseiOptions = useMemo(
    () => toSelectOptions(menseilerQuery.data ?? [], 'Menşei seçin'),
    [menseilerQuery.data],
  )
  const bolgeOptions = useMemo(
    () => toSelectOptions(bolgelerQuery.data ?? [], 'Bölge seçin'),
    [bolgelerQuery.data],
  )
  const mintikaOptions = useMemo(
    () => toSelectOptions(mintikalarQuery.data ?? [], 'Mıntıka seçin'),
    [mintikalarQuery.data],
  )
  const alimNoktasiOptions = useMemo(
    () => toSelectOptions(alimNoktalariQuery.data ?? [], 'Alım noktası seçin'),
    [alimNoktalariQuery.data],
  )
  const koyOptions = useMemo(
    () => toSelectOptions(koylerQuery.data ?? [], 'Köy seçin'),
    [koylerQuery.data],
  )

  return (
    <PageContainer>
      <div>
        {user?.email && (
          <p className="mt-1 text-xs text-muted">
            Oturum: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
      </div>

      <Card className="overflow-hidden !p-0" interactive={false}>
        <div className="grid w-full grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select
            label="Anket"
            value={baslikId}
            onChange={(e) => setBaslikId(e.target.value)}
            options={anketOptions}
            disabled={anketlerQuery.isLoading}
          />
          <Select
            label="Menşei"
            value={menseiId}
            onChange={(e) => setMenseiId(e.target.value)}
            options={menseiOptions}
            disabled={menseilerQuery.isLoading}
          />
          <Select
            label="Bölge"
            value={bolgeId}
            onChange={(e) => setBolgeId(e.target.value)}
            options={bolgeOptions}
            disabled={bolgelerQuery.isLoading}
          />
          <Select
            label="Mıntıka"
            value={mintikaId}
            onChange={(e) => setMintikaId(e.target.value)}
            options={mintikaOptions}
            disabled={mintikalarQuery.isLoading}
          />
          <Select
            label="Alım noktası"
            value={alimNoktasiId}
            onChange={(e) => setAlimNoktasiId(e.target.value)}
            options={alimNoktasiOptions}
            disabled={alimNoktalariQuery.isLoading}
          />
          <Select
            label="Köy"
            value={koyId}
            onChange={(e) => setKoyId(e.target.value)}
            options={koyOptions}
            disabled={koylerQuery.isLoading}
          />
        </div>

        <div className="flex justify-end border-t border-border px-5 py-4">
          <Button
            onClick={handleApplyFilters}
            disabled={!draftFiltersReady}
            loading={responsesQuery.isFetching && filtersReady}
          >
            <Filter className="h-4 w-4" />
            Filtrele
          </Button>
        </div>

        {!filtersReady ? (
          <p className="px-5 pb-5 text-sm text-muted">
            Listelemek için en az bir filtre seçin ve Filtrele&apos;ye tıklayın.
          </p>
        ) : (
          <>
            <SurveyResponseStatsCards
              data={responsesQuery.data ?? []}
              filterSummary={appliedFilterSummary}
              isLoading={responsesQuery.isLoading}
            />
            <SurveyResponsesTable
              data={responsesQuery.data ?? []}
              isLoading={responsesQuery.isLoading}
              isError={responsesQuery.isError}
              error={responsesQuery.error}
              onRefresh={() => void responsesQuery.refetch()}
            />
          </>
        )}
      </Card>
    </PageContainer>
  )
}
