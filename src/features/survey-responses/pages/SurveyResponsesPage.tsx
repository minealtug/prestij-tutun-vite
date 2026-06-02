import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useAuthStore } from '@/stores/auth-store'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { SurveyResponsesTable } from '../components/SurveyResponsesTable'
import { useSurveyResponses } from '../hooks/use-survey-responses'
import { PageContainer } from '@/components/layout/PageContainer'

export function SurveyResponsesPage() {
  const user = useAuthStore((s) => s.user)
  const surveysQuery = useSurveys()
  const [surveyFilter, setSurveyFilter] = useState('')
  const [search, setSearch] = useState('')

  const surveyOptions = useMemo(() => {
    const options = [{ value: '', label: 'Tüm Anketler' }]
    const surveys = surveysQuery.data ?? []
    surveys.forEach((s) => options.push({ value: s.id, label: s.name }))
    return options
  }, [surveysQuery.data])

  const responsesQuery = useSurveyResponses({
    surveyId: surveyFilter || undefined,
    search: search.trim() || undefined,
  })

  return (
    <PageContainer>
      <div>
        <p className="text-sm text-muted">
          Gönderilen anket cevaplarını görüntüleyin ve filtreleyin.
        </p>
        {user?.email && (
          <p className="mt-1 text-xs text-muted">
            Oturum: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
      </div>

      <Card>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <Select
              label="Anket"
              value={surveyFilter}
              onChange={(e) => setSurveyFilter(e.target.value)}
              options={surveyOptions}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="response-search" className="text-sm font-medium text-foreground">
              Arama
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="response-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara: kullanıcı, anket, soru, cevap..."
                className="h-10 w-full rounded-lg border border-border bg-surface-elevated py-2 pr-3 pl-9 text-sm placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>

        <SurveyResponsesTable
          data={responsesQuery.data ?? []}
          isLoading={responsesQuery.isLoading}
          isError={responsesQuery.isError}
          error={responsesQuery.error}
          onRefresh={() => void responsesQuery.refetch()}
        />
      </Card>
    </PageContainer>
  )
}
