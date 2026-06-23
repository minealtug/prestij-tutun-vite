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
import { useEkiciDefinitions } from '@/features/ekici-definitions/hooks/use-ekici-definitions'
import { computeSurveyResponseStats } from '@/features/survey-responses/utils/compute-survey-response-stats'
import { UserSurveyStatusPieChart } from '../components/UserSurveyStatusPieChart'
import { UserSurveyMetricChartCard } from '../components/UserSurveyMetricChartCard'
import { UserContinueSurveysCard } from '../components/UserContinueSurveysCard'
import { UserCompletedSurveysCard } from '../components/UserCompletedSurveysCard'
import { UserMintikaDistributionCard } from '../components/UserMintikaDistributionCard'
import { UserIncompleteSurveysChartCard } from '../components/UserIncompleteSurveysChartCard'
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
  const ekicilerQuery = useEkiciDefinitions()

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
  const enrichedData = useMemo(() => {
    const ekiciler = ekicilerQuery.data ?? []
    if (ekiciler.length === 0) return data

    const ekiciById = new Map(
      ekiciler.map((ekici) => [
        ekici.id,
        {
          menseiAdi: ekici.menseiAdi,
          bolgeAdi: ekici.bolgeAdi,
          mintikaAdi: ekici.mintikaAdi,
        },
      ]),
    )

    return enrichSurveysWithEkiciLocations(data, ekiciById)
  }, [data, ekicilerQuery.data])

  const groups = useMemo(() => groupUserDashboardSurveys(enrichedData), [enrichedData])
  const stats = useMemo(() => computeSurveyResponseStats(enrichedData), [enrichedData])

  const totalSurveyCount = groups.completed.length + groups.partial.length

  const tamamlanmaTrend =
    stats.tamamlanmaYuzdesi != null
      ? `Genel tamamlanma oranı %${stats.tamamlanmaYuzdesi}`
      : 'Henüz anket kaydı yok'

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
          title="Anket Durumu"
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
            description="Toplam anketleriniz içindeki payı"
            isLoading={responsesQuery.isLoading}
          />
          <UserSurveyMetricChartCard
            label="Yarım kalan"
            value={groups.partial.length}
            percent={getStatusPercent(groups.partial.length, totalSurveyCount)}
            color="#f59e0b"
            icon={CircleAlert}
            description="Devam etmeniz gereken anketler"
            isLoading={responsesQuery.isLoading}
          />
          <UserMintikaDistributionCard
            surveys={enrichedData}
            isLoading={responsesQuery.isLoading}
          />
        </div>
      </section>

      <UserContinueSurveysCard
        partialSurveys={groups.partial}
        stalePartialCount={groups.stalePartialCount}
        isLoading={responsesQuery.isLoading}
      />

      <UserCompletedSurveysCard
        completedSurveys={groups.completed}
        isLoading={responsesQuery.isLoading}
      />

      <UserIncompleteSurveysChartCard
        surveys={enrichedData}
        isLoading={responsesQuery.isLoading}
      />
    </PageContainer>
  )
}
