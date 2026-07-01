import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, CircleAlert } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { UserContinueSurveyRow } from './UserContinueSurveyRow'
import { CONTINUE_SURVEY_LIST_LIMIT } from '../utils/user-dashboard-survey-groups'

interface UserContinueSurveysCardProps {
  partialSurveys: AnketCevapOzetItem[]
  stalePartialCount: number
  isLoading?: boolean
}

export function UserContinueSurveysCard({
  partialSurveys,
  stalePartialCount,
  isLoading = false,
}: UserContinueSurveysCardProps) {
  const visibleSurveys = partialSurveys.slice(0, CONTINUE_SURVEY_LIST_LIMIT)
  const hasMore = partialSurveys.length > CONTINUE_SURVEY_LIST_LIMIT

  return (
    <Card
      className="border-amber-200/80 bg-amber-50/20"
      title="Kaldığınız yerden devam edin"
      description={isLoading ? undefined : 'Öncelikli yarım ekici formlarınız'}
      accent
      footer={
        hasMore ? (
          <Link
            to="/cevapladigim-anketler"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Tüm yarım formları gör ({partialSurveys.length})
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted">Formlarınız yükleniyor…</p>
      ) : partialSurveys.length > 0 ? (
        <div className="space-y-3">
          {stalePartialCount > 0 ? (
            <div
              className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900"
              role="status"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-semibold">{stalePartialCount} ekici formu</span> bir haftadan uzun
                süredir yarım — listenin üstündekiler en acil olanlar.
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Öncelikli formlar</p>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {partialSurveys.length} yarım form
            </span>
          </div>

          <ul className="space-y-3">
            {visibleSurveys.map((item, index) => (
              <UserContinueSurveyRow key={item.id} item={item} rank={index + 1} />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          compact
          icon={CheckCircle2}
          title="Yarım form yok"
          description="Devam eden ekici formunuz bulunmuyor."
        />
      )}
    </Card>
  )
}
