import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ClipboardList } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { UserCompletedSurveyRow } from './UserCompletedSurveyRow'

const LIST_LIMIT = 5

interface UserCompletedSurveysCardProps {
  completedSurveys: AnketCevapOzetItem[]
  isLoading?: boolean
}

export function UserCompletedSurveysCard({
  completedSurveys,
  isLoading = false,
}: UserCompletedSurveysCardProps) {
  const visibleSurveys = completedSurveys.slice(0, LIST_LIMIT)
  const hasMore = completedSurveys.length > LIST_LIMIT

  return (
    <Card
      className="border-emerald-200/70 bg-emerald-50/15"
      title="Tamamladığım Anketler"
      accent
      footer={
        hasMore ? (
          <Link
            to="/cevapladigim-anketler"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Tümünü gör ({completedSurveys.length})
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : completedSurveys.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Son kayıtlar</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {completedSurveys.length} tamamlanan
            </span>
          </div>

          <ul className="space-y-3">
            {visibleSurveys.map((item) => (
              <UserCompletedSurveyRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          compact
          icon={ClipboardList}
          title="Henüz tamamlanan anket yok"
          description="Anket doldurduğunuzda tamamlanan kayıtlar burada görünecek."
        />
      )}
    </Card>
  )
}
