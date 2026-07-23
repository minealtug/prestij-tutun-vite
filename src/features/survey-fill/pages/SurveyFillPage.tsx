import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { SurveyFillForm } from '../components/SurveyFillForm'
import { useAnketSablonlar } from '../hooks/use-anket-yanit'
import {
  DEFAULT_SURVEY_FILL_BASLIK_ID,
  parseSurveyFillDeepLink,
  type SurveyFillDeepLinkParams,
} from '../utils/survey-fill-navigation'

function parsePositiveInt(value: string | null): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function SurveyFillPage() {
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedBaslikId, setSelectedBaslikId] = useState(() => {
    const fromUrl = parsePositiveInt(searchParams.get('baslikId'))
    return fromUrl > 0 ? fromUrl : DEFAULT_SURVEY_FILL_BASLIK_ID
  })
  const [selectedSablonId, setSelectedSablonId] = useState(0)
  const [deepLink, setDeepLink] = useState<SurveyFillDeepLinkParams | null>(null)

  const surveysQuery = useSurveys()
  const sablonlarQuery = useAnketSablonlar(selectedBaslikId > 0 ? selectedBaslikId : null)

  useEffect(() => {
    const parsed = parseSurveyFillDeepLink(searchParams)
    if (!parsed) return

    setSelectedBaslikId(parsed.baslikId)
    if (parsed.sablonId) {
      setSelectedSablonId(parsed.sablonId)
    }
    setDeepLink(parsed)
    setSearchParams({ baslikId: String(parsed.baslikId) }, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (parsePositiveInt(searchParams.get('baslikId')) > 0) return
    if (selectedBaslikId <= 0) return
    setSearchParams({ baslikId: String(selectedBaslikId) }, { replace: true })
  }, [searchParams, selectedBaslikId, setSearchParams])

  useEffect(() => {
    const surveys = surveysQuery.data
    if (!surveys || selectedBaslikId <= 0) return

    const exists = surveys.some((survey) => Number(survey.id) === selectedBaslikId)
    if (!exists) {
      setSelectedBaslikId(0)
      setDeepLink(null)
      setSearchParams({}, { replace: true })
    }
  }, [surveysQuery.data, selectedBaslikId, setSearchParams])

  useEffect(() => {
    if (selectedBaslikId <= 0) {
      setSelectedSablonId(0)
      return
    }

    const sablonlar = sablonlarQuery.data ?? []
    if (sablonlar.length === 0) {
      setSelectedSablonId(0)
      return
    }

    const preferredSablonId = deepLink?.baslikId === selectedBaslikId ? deepLink.sablonId : undefined
    if (preferredSablonId && sablonlar.some((sablon) => sablon.id === preferredSablonId)) {
      setSelectedSablonId(preferredSablonId)
      return
    }

    const currentSablonValid = sablonlar.some((sablon) => sablon.id === selectedSablonId)
    if (!currentSablonValid) {
      setSelectedSablonId(sablonlar[0].id)
    }
  }, [selectedBaslikId, sablonlarQuery.data, selectedSablonId, deepLink])

  const selectedSurvey = useMemo(
    () => (surveysQuery.data ?? []).find((survey) => Number(survey.id) === selectedBaslikId),
    [surveysQuery.data, selectedBaslikId],
  )

  const selectedSablon = useMemo(
    () => (sablonlarQuery.data ?? []).find((sablon) => sablon.id === selectedSablonId),
    [sablonlarQuery.data, selectedSablonId],
  )

  const surveyOptions = useMemo(
    () => [
      {
        key: 'placeholder',
        value: '',
        label: surveysQuery.isLoading ? 'Anketler yükleniyor...' : 'Anket seçin',
      },
      ...(surveysQuery.data ?? []).map((survey) => ({
        key: String(survey.id),
        value: String(survey.id),
        label: survey.name,
      })),
    ],
    [surveysQuery.data, surveysQuery.isLoading],
  )

  const sessionReady = selectedBaslikId > 0
  const selectDisabled =
    surveysQuery.isLoading && (surveysQuery.data ?? []).length === 0

  const activeDeepLink =
    deepLink && deepLink.baslikId === selectedBaslikId ? deepLink : null

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler kontrol ediliyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  return (
    <PageContainer>
      <Card className="overflow-hidden !p-0" interactive={false}>
        <div className="grid gap-4 p-5">
          <Select
            label="Anket"
            value={selectedBaslikId > 0 ? String(selectedBaslikId) : ''}
            onChange={(e) => {
              const baslikId = Number(e.target.value) || 0
              setSelectedBaslikId(baslikId)
              setSelectedSablonId(0)
              setDeepLink(null)
              if (baslikId > 0) {
                setSearchParams({ baslikId: String(baslikId) }, { replace: true })
              } else {
                setSearchParams({}, { replace: true })
              }
            }}
            options={surveyOptions}
            disabled={selectDisabled}
            required
          />
        </div>

        {sessionReady ? (
          <SurveyFillForm
            baslikId={selectedBaslikId}
            sablonId={selectedSablonId}
            baslikAdi={selectedSurvey?.name}
            sablonAdi={selectedSablon?.adi}
            initialEkiciId={activeDeepLink?.ekiciId ?? null}
            initialGeoFilters={activeDeepLink}
            canSubmit={canEdit && selectedSablonId > 0}
            onRefreshSablonlar={() => void sablonlarQuery.refetch()}
          />
        ) : (
          <div className="border-t border-border px-5 py-8 text-sm text-muted">
            {selectDisabled ? 'Anketler yükleniyor…' : 'Soruları görmek için Anket seçin.'}
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
