import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  HelpCircle,
  FileQuestion,
  ListChecks,
  CircleHelp,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useQuestions } from '@/features/questions/hooks/use-questions'
import { useAuthStore } from '@/stores/auth-store'
import { PERMISSION_DENIED_KEY } from '@/features/permissions/hooks/use-require-page-permission'

function displayCount(value: number | undefined, loading: boolean) {
  if (loading) return '…'
  if (value === undefined) return '—'
  return value.toLocaleString('tr-TR')
}

function getGreetingByHour(hour: number) {
  if (hour < 12) return 'Günaydın'
  if (hour < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export function AdminDashboardPage() {
  const [activityPage, setActivityPage] = useState(1)
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const activityPageSize = 4
  const user = useAuthStore((state) => state.user)
  const surveysQuery = useSurveys()
  const questionsQuery = useQuestions()

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

  const linkedQuestionCount = questionsQuery.data?.filter((question) => question.bagliSoru).length
  const recentItems = [
    ...(surveysQuery.data ?? []).slice(0, 3).map((survey) => ({
      id: `survey-${survey.id}`,
      type: 'survey' as const,
      action: 'Anket Eklendi',
      description: `"${survey.name}" anketi tanımlandı.`,
    })),
    ...(questionsQuery.data ?? []).slice(0, 5).map((question) => ({
      id: `question-${question.id}`,
      type: 'question' as const,
      action: 'Soru Eklendi',
      description: question.soruMetni,
    })),
  ].slice(0, 8)
  const totalActivityPages = Math.max(1, Math.ceil(recentItems.length / activityPageSize))
  const pagedRecentItems = useMemo(() => {
    const safePage = Math.min(activityPage, totalActivityPages)
    const start = (safePage - 1) * activityPageSize
    return recentItems.slice(start, start + activityPageSize)
  }, [activityPage, recentItems, totalActivityPages])

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
          label="Son İşlem"
          value={displayCount(recentItems.length, surveysQuery.isLoading || questionsQuery.isLoading)}
          icon={FileQuestion}
          variant="muted"
        />
        <StatCard
          label="Bağlı Soru"
          value={displayCount(linkedQuestionCount, questionsQuery.isLoading)}
          icon={HelpCircle}
          variant="muted"
          trend="Toplam bağlı soru sayısı"
        />
      </section>

      <Card
        title="Son Yapılan İşlemler"
        description="En son eklenen anket ve soru kayıtları"
        accent
      >
        {surveysQuery.isLoading || questionsQuery.isLoading ? (
          <p className="text-sm text-muted">Veriler yükleniyor…</p>
        ) : recentItems.length > 0 ? (
          <div className="space-y-3">
            <ul className="space-y-2">
              {pagedRecentItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border/80 bg-surface-elevated/70 px-3 py-2"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      item.type === 'survey'
                        ? 'bg-primary-500/10 text-primary-600'
                        : 'bg-accent-500/15 text-accent-600'
                    }`}
                  >
                    {item.type === 'survey' ? (
                      <ListChecks className="h-4 w-4" />
                    ) : (
                      <CircleHelp className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted">
                        {item.type === 'survey' ? 'Anket' : 'Soru'}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            {totalActivityPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted">
                  Sayfa {Math.min(activityPage, totalActivityPages)} / {totalActivityPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                    disabled={activityPage <= 1}
                  >
                    Önceki
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      setActivityPage((prev) => Math.min(totalActivityPages, prev + 1))
                    }
                    disabled={activityPage >= totalActivityPages}
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            compact
            icon={HelpCircle}
            title="Henüz kayıt yok"
            description="Anket ve soru eklendiğinde burada listelenecek."
          />
        )}
      </Card>
    </PageContainer>
  )
}
