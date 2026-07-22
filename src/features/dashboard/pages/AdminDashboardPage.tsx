import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@/components/feedback/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { getMintikaIdsForCografiFiltre } from '@/features/cografi-filtre/utils/cografi-filtre'
import { useEkiciDefinitions } from '@/features/ekici-definitions/hooks/use-ekici-definitions'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import { PERMISSION_DENIED_KEY } from '@/features/permissions/hooks/use-require-page-permission'
import { useAllSurveyResponses } from '@/features/survey-responses/hooks/use-survey-responses'
import { useUsers } from '@/features/users/hooks/use-users'
import { useAuthStore } from '@/stores/auth-store'
import { AdminFieldFillSummarySection } from '../components/AdminFieldFillSummarySection'
import { AdminGeoComparisonCard } from '../components/AdminGeoComparisonCard'
import { AdminStalePartialsCard } from '../components/AdminStalePartialsCard'
import { AdminUserActivityCard } from '../components/AdminUserActivityCard'
import { enrichSurveysWithEkiciLocations } from '../utils/enrich-survey-location'
import {
  buildAdminStalePartialRows,
  computeAdminFieldFillSummary,
  computeAdminUserActivity,
  computeBolgeComparison,
  computeMintikaComparison,
  countStalePartials,
  filterSurveysByCografi,
  type AdminActivityDayWindow,
} from '../utils/admin-dashboard-stats'

function getGreetingByHour(hour: number) {
  if (hour < 12) return 'Günaydın'
  if (hour < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export function AdminDashboardPage() {
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [activityDays, setActivityDays] = useState<AdminActivityDayWindow>(7)
  const user = useAuthStore((state) => state.user)

  const responsesQuery = useAllSurveyResponses()
  const usersQuery = useUsers()
  const ekicilerQuery = useEkiciDefinitions()
  const cografiFiltreQuery = useCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)

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

    const enriched = enrichSurveysWithEkiciLocations(
      responsesQuery.data ?? [],
      locationById,
      mintikaById,
    )

    return enriched.map((item) => {
      const ekici = ekiciById.get(item.ekiciId)
      if (!ekici) return item
      return {
        ...item,
        mintikaId: ekici.mintikaId > 0 ? ekici.mintikaId : item.mintikaId,
      }
    })
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

  const fieldFillSummary = useMemo(
    () => computeAdminFieldFillSummary(filteredSurveys, now),
    [filteredSurveys, now],
  )
  const mintikaRows = useMemo(
    () => computeMintikaComparison(filteredSurveys),
    [filteredSurveys],
  )
  const bolgeRows = useMemo(() => computeBolgeComparison(filteredSurveys), [filteredSurveys])
  const userActivity = useMemo(
    () => computeAdminUserActivity(usersQuery.data ?? [], filteredSurveys, activityDays, now),
    [activityDays, filteredSurveys, now, usersQuery.data],
  )
  const staleRows = useMemo(
    () => buildAdminStalePartialRows(filteredSurveys, 10),
    [filteredSurveys],
  )
  const staleCount = useMemo(() => countStalePartials(filteredSurveys), [filteredSurveys])

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
        summary={userActivity}
        dayWindow={activityDays}
        onDayWindowChange={setActivityDays}
        isLoading={usersQuery.isLoading || surveysLoading}
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

      <AdminFieldFillSummarySection summary={fieldFillSummary} isLoading={surveysLoading} />

      <AdminGeoComparisonCard
        mintikaRows={mintikaRows}
        bolgeRows={bolgeRows}
        isLoading={surveysLoading}
      />

      <AdminStalePartialsCard
        rows={staleRows}
        staleCount={staleCount}
        isLoading={surveysLoading}
      />
    </PageContainer>
  )
}
