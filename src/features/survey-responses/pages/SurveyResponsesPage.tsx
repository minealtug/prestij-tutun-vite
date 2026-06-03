import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useAuthStore } from '@/stores/auth-store'
import { SurveyResponsesTable } from '../components/SurveyResponsesTable'
import {
  useAlimNoktalari,
  useBolgeler,
  useKoyler,
  useMenseiler,
  useMintikalar,
} from '../hooks/use-survey-response-filters'
import { useSurveyResponses } from '../hooks/use-survey-responses'
import { PageContainer } from '@/components/layout/PageContainer'
import type { FilterOptionDto } from '../types/survey-response.types'
import { hasAllSurveyFilters } from '../types/survey-response.types'

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
  const [menseiId, setMenseiId] = useState('')
  const [bolgeId, setBolgeId] = useState('')
  const [mintikaId, setMintikaId] = useState('')
  const [alimNoktasiId, setAlimNoktasiId] = useState('')
  const [koyId, setKoyId] = useState('')

  const menseiIdNum = menseiId ? Number(menseiId) : undefined
  const bolgeIdNum = bolgeId ? Number(bolgeId) : undefined
  const mintikaIdNum = mintikaId ? Number(mintikaId) : undefined
  const alimNoktasiIdNum = alimNoktasiId ? Number(alimNoktasiId) : undefined
  const koyIdNum = koyId ? Number(koyId) : undefined

  const menseilerQuery = useMenseiler()
  const bolgelerQuery = useBolgeler(menseiIdNum)
  const mintikalarQuery = useMintikalar(bolgeIdNum)
  const alimNoktalariQuery = useAlimNoktalari(mintikaIdNum)
  const koylerQuery = useKoyler(alimNoktasiIdNum)

  const filterParams = useMemo(
    () => ({
      menseiId: menseiIdNum,
      bolgeId: bolgeIdNum,
      mintikaId: mintikaIdNum,
      alimNoktasiId: alimNoktasiIdNum,
      koyId: koyIdNum,
    }),
    [menseiIdNum, bolgeIdNum, mintikaIdNum, alimNoktasiIdNum, koyIdNum],
  )

  const responsesQuery = useSurveyResponses(filterParams)
  const filtersReady = hasAllSurveyFilters(filterParams)

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

  const onMenseiChange = (value: string) => {
    setMenseiId(value)
    setBolgeId('')
    setMintikaId('')
    setAlimNoktasiId('')
    setKoyId('')
  }

  const onBolgeChange = (value: string) => {
    setBolgeId(value)
    setMintikaId('')
    setAlimNoktasiId('')
    setKoyId('')
  }

  const onMintikaChange = (value: string) => {
    setMintikaId(value)
    setAlimNoktasiId('')
    setKoyId('')
  }

  const onAlimNoktasiChange = (value: string) => {
    setAlimNoktasiId(value)
    setKoyId('')
  }

  return (
    <PageContainer>
      <div>
        {user?.email && (
          <p className="mt-1 text-xs text-muted">
            Oturum: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
      </div>

      <Card>
        <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Select
            label="Menşei"
            value={menseiId}
            onChange={(e) => onMenseiChange(e.target.value)}
            options={menseiOptions}
            disabled={menseilerQuery.isLoading}
          />
          <Select
            label="Bölge"
            value={bolgeId}
            onChange={(e) => onBolgeChange(e.target.value)}
            options={bolgeOptions}
            disabled={!menseiId || bolgelerQuery.isLoading}
          />
          <Select
            label="Mıntıka"
            value={mintikaId}
            onChange={(e) => onMintikaChange(e.target.value)}
            options={mintikaOptions}
            disabled={!bolgeId || mintikalarQuery.isLoading}
          />
          <Select
            label="Alım noktası"
            value={alimNoktasiId}
            onChange={(e) => onAlimNoktasiChange(e.target.value)}
            options={alimNoktasiOptions}
            disabled={!mintikaId || alimNoktalariQuery.isLoading}
          />
          <Select
            label="Köy"
            value={koyId}
            onChange={(e) => setKoyId(e.target.value)}
            options={koyOptions}
            disabled={!alimNoktasiId || koylerQuery.isLoading}
          />
        </div>

        {!filtersReady ? (
          <p className="text-sm text-muted">
            Listelemek için menşei, bölge, mıntıka, alım noktası ve köy seçin.
          </p>
        ) : (
          <SurveyResponsesTable
            data={responsesQuery.data ?? []}
            isLoading={responsesQuery.isLoading}
            isError={responsesQuery.isError}
            error={responsesQuery.error}
            onRefresh={() => void responsesQuery.refetch()}
          />
        )}
      </Card>
    </PageContainer>
  )
}
