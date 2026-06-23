import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import {
  formatRelativeSonIslem,
  getSurveyListSubtitle,
  getSurveyListTitle,
} from '../utils/user-dashboard-survey-groups'

interface UserCompletedSurveyRowProps {
  item: AnketCevapOzetItem
}

export function UserCompletedSurveyRow({ item }: UserCompletedSurveyRowProps) {
  const title = getSurveyListTitle(item)
  const subtitle = getSurveyListSubtitle(item)
  const answered = Math.max(0, item.yanitlananSoruSayisi)

  return (
    <li className="group rounded-xl border border-emerald-200/70 bg-gradient-to-r from-white to-emerald-50/40 px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Tamamlandı
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted">{subtitle}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-800">
            {answered.toLocaleString('tr-TR')} soru
          </span>
          <span aria-hidden>·</span>
          <span>Son işlem: {formatRelativeSonIslem(item.sonIslemTarihi)}</span>
        </div>
      </div>
    </li>
  )
}
