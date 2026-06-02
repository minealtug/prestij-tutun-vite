import {
  Users,
  UserCheck,
  TrendingUp,
  Banknote,
  Activity,
  ClipboardList,
  HelpCircle,
  Server,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { QueryBoundary } from '@/components/feedback/QueryBoundary'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useQuestions } from '@/features/questions/hooks/use-questions'
import { useDashboardActivity, useDashboardSummary } from '../hooks/use-dashboard'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

function displayCount(value: number | undefined, loading: boolean) {
  if (loading) return '…'
  if (value === undefined) return '—'
  return value.toLocaleString('tr-TR')
}

export function DashboardPage() {
  const summaryQuery = useDashboardSummary()
  const activityQuery = useDashboardActivity()
  const surveysQuery = useSurveys()
  const questionsQuery = useQuestions()

  const summary = summaryQuery.data
  const apiConnected = summaryQuery.isSuccess
  const apiStatusLabel = summaryQuery.isLoading
    ? 'Kontrol…'
    : apiConnected
      ? 'Bağlı'
      : 'Çevrimdışı'

  const kpiCards = summary
    ? [
        {
          title: 'Toplam Kullanıcı',
          value: summary.totalUsers.toLocaleString('tr-TR'),
          icon: Users,
          accent: false,
        },
        {
          title: 'Aktif Kullanıcı',
          value: summary.activeUsers.toLocaleString('tr-TR'),
          icon: UserCheck,
          accent: true,
        },
        {
          title: 'Gelir',
          value: formatCurrency(summary.revenue),
          icon: Banknote,
          accent: false,
        },
        {
          title: 'Büyüme',
          value: `%${summary.growthPercent}`,
          icon: TrendingUp,
          accent: true,
        },
      ]
    : []

  return (
    <PageContainer>
      <section className="gradient-brand rounded-2xl px-6 py-5 shadow-lg md:px-8 md:py-6">
        <p className="text-xs font-medium uppercase tracking-wider text-white/75">
          Kurumsal özet
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">
          Ana Sayfa
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
          Operasyonel metrikler ve son aktiviteler .NET API üzerinden yüklenir.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Toplam Anket"
          value={displayCount(surveysQuery.data?.length, surveysQuery.isLoading)}
          icon={ClipboardList}
          variant="default"
        />
        <StatCard
          label="Toplam Soru"
          value={displayCount(questionsQuery.data?.length, questionsQuery.isLoading)}
          icon={HelpCircle}
          variant="default"
        />
        <StatCard
          label="Kullanıcı"
          value={
            summary
              ? summary.totalUsers.toLocaleString('tr-TR')
              : summaryQuery.isLoading
                ? '…'
                : '—'
          }
          icon={Users}
          variant="muted"
          trend={summary ? undefined : 'Özet API bekleniyor'}
        />
        <StatCard
          label="API Durumu"
          value={apiStatusLabel}
          icon={Server}
          variant={apiConnected ? 'success' : summaryQuery.isError ? 'warning' : 'muted'}
          trend={apiConnected ? 'GET /api/dashboard/summary' : '.NET backend'}
        />
      </section>

      <section className="section-stack">
        <QueryBoundary
          query={summaryQuery}
          loadingVariant="skeleton-stats"
          errorTitle="Özet alınamadı"
          errorVariant="compact"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map(({ title, value, icon: Icon, accent }) => (
              <Card key={title} accent={accent} className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                  </div>
                  <div
                    className={`rounded-lg p-2 ${accent ? 'bg-accent-500/20 text-accent-600' : 'bg-primary-500/10 text-primary-600'}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </QueryBoundary>
      </section>

      <Card title="Son aktiviteler" description="GET /api/dashboard/activity" accent>
        <QueryBoundary
          query={activityQuery}
          loadingVariant="skeleton-activity"
          errorTitle="Aktiviteler alınamadı"
          errorVariant="compact"
        >
          {activityQuery.data && activityQuery.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {activityQuery.data.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted">{item.description}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(item.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={Activity}
              title="Henüz aktivite yok"
              description="API bağlandığında son işlemler burada listelenecek."
            />
          )}
        </QueryBoundary>
      </Card>
    </PageContainer>
  )
}
