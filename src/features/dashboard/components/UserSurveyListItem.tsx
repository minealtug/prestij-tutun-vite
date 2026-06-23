import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardPen } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { formatSonIslemTarihi } from '@/features/survey-responses/utils/map-anket-cevap'
import { Button } from '@/components/ui/Button'
import { UserSurveyProgressBar } from './UserSurveyProgressBar'
import {
  buildSurveyFillLinkFromOzet,
  getItemProgressPercent,
  getSurveyListSubtitle,
  getSurveyListTitle,
  getSurveyResponseStatus,
} from '../utils/user-dashboard-survey-groups'

interface UserSurveyListItemProps {
  item: AnketCevapOzetItem
  variant: 'partial' | 'completed' | 'notStarted'
}

export function UserSurveyListItem({ item, variant }: UserSurveyListItemProps) {
  const navigate = useNavigate()
  const title = getSurveyListTitle(item)
  const subtitle = getSurveyListSubtitle(item)
  const status = getSurveyResponseStatus(item)
  const progress = getItemProgressPercent(item)
  const fillLink = buildSurveyFillLinkFromOzet(item)
  const answered = Math.max(0, item.yanitlananSoruSayisi)
  const unanswered = Math.max(0, item.yanitlanmayanSoruSayisi)
  const total = answered + unanswered

  const borderClass =
    variant === 'completed'
      ? 'border-l-emerald-500'
      : variant === 'partial'
        ? 'border-l-amber-500'
        : 'border-l-primary-400'

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border border-border/80 border-l-4 bg-surface-elevated/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${borderClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {variant === 'completed' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <ClipboardPen className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>

        {status !== 'completed' && total > 0 ? (
          <div className="mt-3 space-y-1.5">
            <UserSurveyProgressBar percent={progress} />
            <p className="text-xs text-muted">
              %{progress} tamamlandı · {answered} cevaplı / {unanswered} cevapsız
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">
            {total > 0 ? `${answered} soru tamamlandı` : 'Henüz başlanmadı'}
          </p>
        )}

        <p className="mt-1.5 text-[11px] text-muted">
          Son işlem: {formatSonIslemTarihi(item.sonIslemTarihi)}
        </p>
      </div>

      <div className="shrink-0 sm:pl-4">
        {variant === 'completed' ? (
          <Button variant="outline" size="sm" onClick={() => navigate('/cevapladigim-anketler')}>
            Görüntüle
          </Button>
        ) : (
          <Button
            size="sm"
            variant={variant === 'notStarted' ? 'primary' : 'primary'}
            onClick={() => navigate(fillLink ?? '/anket-doldurma')}
          >
            {variant === 'notStarted' ? 'Anketi Doldur' : 'Devam Et'}
          </Button>
        )}
      </div>
    </li>
  )
}
