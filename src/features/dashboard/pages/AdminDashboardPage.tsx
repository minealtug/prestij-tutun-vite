import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@/components/feedback/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { hasCografiFiltreSelection } from '@/features/cografi-filtre/types'
import { getMintikaIdsForCografiFiltre } from '@/features/cografi-filtre/utils/cografi-filtre'
import { useEkiciDefinitions } from '@/features/ekici-definitions/hooks/use-ekici-definitions'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import { PERMISSION_DENIED_KEY } from '@/features/permissions/hooks/use-require-page-permission'
import {
  useAllSurveyResponses,
  useAnketGirisDurumuSayilari,
  useAnketGirisDurumuSayilariCografi,
} from '@/features/survey-responses/hooks/use-survey-responses'
import { useAuthStore } from '@/stores/auth-store'
import { AdminFieldFillSummarySection } from '../components/AdminFieldFillSummarySection'
import { AdminStalePartialsCard } from '../components/AdminStalePartialsCard'
import { AdminUserActivityCard } from '../components/AdminUserActivityCard'
import { useWithoutTobaccoEkiciCount, useWithTobaccoProducerCount } from '../hooks/use-gezi'
import { enrichSurveysWithEkiciLocations } from '../utils/enrich-survey-location'
import {
  computeAdminFieldFillSummary,
  computeAdminEkiciActivity,
  filterEkicilerByCografi,
  filterSurveysByCografi,
} from '../utils/admin-dashboard-stats'
import {
  buildCografiEkiciFillRows,
  getCografiFillRowLabels,
} from '../utils/build-cografi-fill-rows'
import { computeMintikaEkiciFillRows } from '../utils/compute-ekici-survey-coverage'

function getGreetingByHour(hour: number) {
  if (hour < 12) return 'Günaydın'
  if (hour < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export function AdminDashboardPage() {
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const user = useAuthStore((state) => state.user)

  const responsesQuery = useAllSurveyResponses()
  const ekicilerQuery = useEkiciDefinitions()
  const girisDurumuQuery = useAnketGirisDurumuSayilari()
  const withoutTobaccoQuery = useWithoutTobaccoEkiciCount()
  const withTobaccoQuery = useWithTobaccoProducerCount()
  const cografiFiltreQuery = useCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)
  const geoFilterActive = hasCografiFiltreSelection(geoCascade.queryParams)
  const girisDurumuCografiQuery = useAnketGirisDurumuSayilariCografi(geoCascade.queryParams)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const message = sessionStorage.getItem(PERMISSION_DENIED_KEY)
    if (!message) return
    sessionStorage.removeItem(PERMISSION_DENIED_KEY)
    setPermissionMessage(message)
    const timeout = window.setTimeout(() => setPermissionMessage(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [])

  const greeting = getGreetingByHour(now.getHours())
  const displayName = user?.fullName?.trim() || user?.userName?.trim() || 'Kullanıcı'
  const currentDateTime = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)

  const ekiciById = useMemo(() => {
    const map = new Map<string, EkiciDefinitionDto>()
    for (const ekici of ekicilerQuery.data ?? []) {
      map.set(ekici.id, ekici)
    }
    return map
  }, [ekicilerQuery.data])

  const enrichedSurveys = useMemo(() => {
    const mintikaById = new Map<number, string>()
    for (const ekici of ekicilerQuery.data ?? []) {
      if (ekici.mintikaId > 0 && ekici.mintikaAdi?.trim()) {
        mintikaById.set(ekici.mintikaId, ekici.mintikaAdi.trim())
      }
    }

    const locationById = new Map(
      [...ekiciById.entries()].map(([id, ekici]) => [
        id,
        {
          mintikaId: ekici.mintikaId,
          menseiAdi: ekici.menseiAdi,
          bolgeAdi: ekici.bolgeAdi,
          mintikaAdi: ekici.mintikaAdi,
        },
      ]),
    )

    return enrichSurveysWithEkiciLocations(
      responsesQuery.data ?? [],
      locationById,
      mintikaById,
    )
  }, [ekiciById, ekicilerQuery.data, responsesQuery.data])

  const filteredSurveys = useMemo(() => {
    const options = cografiFiltreQuery.data
    const mintikaIds = options
      ? getMintikaIdsForCografiFiltre(options, geoCascade.queryParams)
      : null
    return filterSurveysByCografi(
      enrichedSurveys,
      ekiciById,
      geoCascade.queryParams,
      mintikaIds,
    )
  }, [cografiFiltreQuery.data, ekiciById, enrichedSurveys, geoCascade.queryParams])

  const surveysLoading =
    responsesQuery.isLoading || ekicilerQuery.isLoading || cografiFiltreQuery.isLoading

  const filteredEkiciler = useMemo(
    () => filterEkicilerByCografi(ekicilerQuery.data ?? [], geoCascade.queryParams),
    [ekicilerQuery.data, geoCascade.queryParams],
  )

  const fieldFillSummary = useMemo(
    () => computeAdminFieldFillSummary(filteredSurveys, now),
    [filteredSurveys, now],
  )
  const mintikaFillRows = useMemo(
    () => computeMintikaEkiciFillRows(filteredEkiciler, filteredSurveys),
    [filteredEkiciler, filteredSurveys],
  )
  const cografiFillRows = useMemo(
    () =>
      buildCografiEkiciFillRows(
        girisDurumuCografiQuery.data,
        getCografiFillRowLabels(cografiFiltreQuery.data, geoCascade.queryParams),
      ),
    [cografiFiltreQuery.data, geoCascade.queryParams, girisDurumuCografiQuery.data],
  )
  const fieldFillRows = geoFilterActive ? cografiFillRows : mintikaFillRows
  const fieldFillStatusCounts = geoFilterActive
    ? girisDurumuCografiQuery.data
    : girisDurumuQuery.data
  const fieldFillLoading = geoFilterActive
    ? girisDurumuCografiQuery.isLoading || surveysLoading
    : surveysLoading || girisDurumuQuery.isLoading
  const ekiciActivity = useMemo(
    () => computeAdminEkiciActivity(ekicilerQuery.data ?? [], enrichedSurveys),
    [ekicilerQuery.data, enrichedSurveys],
  )
  return (
    <PageContainer>
      {permissionMessage && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {permissionMessage}
        </div>
      )}

      <section className="gradient-brand rounded-md px-6 py-5 shadow-lg md:px-8 md:py-6">
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-white/80">{currentDateTime}</p>
      </section>

      <AdminUserActivityCard
        summary={ekiciActivity}
        statusCounts={girisDurumuQuery.data}
        activeCount={withTobaccoQuery.data ?? 0}
        activeLoading={withTobaccoQuery.isLoading}
        withoutTobaccoCount={withoutTobaccoQuery.data ?? 0}
        withoutTobaccoLoading={withoutTobaccoQuery.isLoading}
        isLoading={girisDurumuQuery.isLoading}
      />

      <section className="rounded-md border border-[#e8ecf0] bg-white px-4 py-3">
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
            onMenseiChange={geoCascade.setMenseiId}
            onBolgeChange={geoCascade.setBolgeId}
            onMintikaChange={geoCascade.setMintikaId}
            onAlimNoktasiChange={geoCascade.setAlimNoktasiId}
            onKoyChange={geoCascade.setKoyId}
          />
        )}
      </section>

      <AdminFieldFillSummarySection
        summary={fieldFillSummary}
        mintikaRows={fieldFillRows}
        statusCounts={fieldFillStatusCounts}
        isLoading={fieldFillLoading}
        geoFilterActive={geoFilterActive}
      />

      <AdminStalePartialsCard />
    </PageContainer>
  )
}
