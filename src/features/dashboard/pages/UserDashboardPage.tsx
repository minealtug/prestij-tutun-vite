import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuthStore } from '@/stores/auth-store'
import { PERMISSION_DENIED_KEY } from '@/features/permissions/hooks/use-require-page-permission'
import { useMySurveyResponses } from '@/features/survey-responses/hooks/use-survey-responses'
import {
  useEkiciDefinitions,
  useMyEkiciler,
} from '@/features/ekici-definitions/hooks/use-ekici-definitions'
import { useMintikas } from '@/features/users/hooks/use-users'
import { computeSurveyResponseStats } from '@/features/survey-responses/utils/compute-survey-response-stats'
import { UserSurveyStatusPieChart } from '../components/UserSurveyStatusPieChart'
import { UserSurveyMetricChartCard } from '../components/UserSurveyMetricChartCard'
import { UserContinueSurveysCard } from '../components/UserContinueSurveysCard'
import { UserFilledEkiciCard } from '../components/UserFilledEkiciCard'
import { UserFormStatusTableCard } from '../components/UserFormStatusTableCard'
import { enrichSurveysWithEkiciLocations } from '../utils/enrich-survey-location'
import { groupUserDashboardSurveys } from '../utils/user-dashboard-survey-groups'

function getStatusPercent(count: number, total: number): number | null {
  if (total <= 0) return null
  return Math.round((count / total) * 100)
}

function getGreetingByHour(hour: number) {
  if (hour < 12) return 'Günaydın'
  if (hour < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export function UserDashboardPage() {
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const user = useAuthStore((state) => state.user)
  const userId = user?.id
  const responsesQuery = useMySurveyResponses(userId)
  const myEkicilerQuery = useMyEkiciler()
  const ekicilerQuery = useEkiciDefinitions()
  const mintikasQuery = useMintikas()

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

  const data = useMemo(() => responsesQuery.data ?? [], [responsesQuery.data])
  const myEkiciIds = useMemo(
    () =>
      (myEkicilerQuery.data ?? [])
        .filter((ekici) => ekici.aktif === 1)
        .map((ekici) => ekici.id),
    [myEkicilerQuery.data],
  )
  const ekiciCoverageLoading = responsesQuery.isLoading || myEkicilerQuery.isLoading
  const enrichedData = useMemo(() => {
    const ekiciler = ekicilerQuery.data ?? []
    const mintikaById = new Map<number, string>()

    for (const mintika of mintikasQuery.data ?? []) {
      if (mintika.adi?.trim()) mintikaById.set(mintika.id, mintika.adi.trim())
    }
    for (const ekici of ekiciler) {
      if (ekici.mintikaId > 0 && ekici.mintikaAdi?.trim()) {
        mintikaById.set(ekici.mintikaId, ekici.mintikaAdi.trim())
      }
    }

    const ekiciById = new Map(
      ekiciler.map((ekici) => [
        ekici.id,
        {
          mintikaId: ekici.mintikaId,
          menseiAdi: ekici.menseiAdi,
          bolgeAdi: ekici.bolgeAdi,
          mintikaAdi: ekici.mintikaAdi,
        },
      ]),
    )

    return enrichSurveysWithEkiciLocations(data, ekiciById, mintikaById)
  }, [data, ekicilerQuery.data, mintikasQuery.data])

  const groups = useMemo(() => groupUserDashboardSurveys(enrichedData), [enrichedData])
  const stats = useMemo(() => computeSurveyResponseStats(enrichedData), [enrichedData])

  const totalSurveyCount = groups.completed.length + groups.partial.length

  const tamamlanmaTrend =
    stats.tamamlanmaOrani != null
      ? `Form tamamlama oranı %${stats.tamamlanmaOrani}`
      : 'Henüz form kaydı yok'

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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card
          title="Ekici form tamamlama durumu"
          description={tamamlanmaTrend}
          interactive={false}
        >
          <UserSurveyStatusPieChart
            completed={groups.completed.length}
            partial={groups.partial.length}
            isLoading={responsesQuery.isLoading}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <UserSurveyMetricChartCard
            label="Tamamladığım"
            value={groups.completed.length}
            percent={getStatusPercent(groups.completed.length, totalSurveyCount)}
            color="#10b981"
            icon={CheckCircle2}
            description="Toplam formlarınız içindeki payı"
            isLoading={responsesQuery.isLoading}
          />
          <UserSurveyMetricChartCard
            label="Yarım kalan"
            value={groups.partial.length}
            percent={getStatusPercent(groups.partial.length, totalSurveyCount)}
            color="#f59e0b"
            icon={CircleAlert}
            description="Devam etmeniz gereken formlar"
            isLoading={responsesQuery.isLoading}
          />
          <UserFilledEkiciCard
            ekiciIds={myEkiciIds}
            surveys={data}
            isLoading={ekiciCoverageLoading}
          />
        </div>
      </section>

      <UserContinueSurveysCard
        partialSurveys={groups.partial}
        stalePartialCount={groups.stalePartialCount}
        isLoading={responsesQuery.isLoading}
      />

      <UserFormStatusTableCard
        completedForms={groups.completed}
        partialForms={groups.partial}
        isLoading={responsesQuery.isLoading}
      />
    </PageContainer>
  )
}
