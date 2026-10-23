import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ChevronRight } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { Button } from '@/components/ui/Button'
import { UserSurveyProgressBar } from './UserSurveyProgressBar'
import {
  buildSurveyFillLinkFromOzet,
  formatRelativeSonIslem,
  getItemProgressPercent,
  getSurveyListSubtitle,
  getSurveyListTitle,
} from '../utils/user-dashboard-survey-groups'

interface UserContinueSurveyRowProps {
  item: AnketCevapOzetItem
  rank?: number
}

function MiniProgressRing({ percent }: { percent: number }) {
  const chartData = [
    { name: 'value', value: percent },
    { name: 'rest', value: Math.max(0, 100 - percent) },
  ]

  return (
    <div className="relative h-12 w-12 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={16}
            outerRadius={22}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill="#f59e0b" />
            <Cell fill="#e8edf2" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-foreground">%{percent}</span>
      </div>
    </div>
  )
}

export function UserContinueSurveyRow({ item, rank }: UserContinueSurveyRowProps) {
  const navigate = useNavigate()
  const title = getSurveyListTitle(item)
  const subtitle = getSurveyListSubtitle(item)
  const progress = getItemProgressPercent(item)
  const unanswered = Math.max(0, item.yanitlanmayanSoruSayisi)
  const fillLink = buildSurveyFillLinkFromOzet(item)

  return (
    <li className="rounded-lg border border-amber-200/70 bg-white/80 px-4 py-3">
      <div className="flex items-start gap-3">
        {rank != null ? (
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-800">
            {rank}
          </span>
        ) : null}

        <MiniProgressRing percent={progress} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{subtitle}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{title}</p>
            </div>
            <Button size="sm" onClick={() => navigate(fillLink ?? '/anket-doldurma')}>
              Devam Et
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 space-y-1.5">
            <UserSurveyProgressBar percent={progress} barClassName="bg-amber-500" />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>
                {unanswered > 0
                  ? `${unanswered.toLocaleString('tr-TR')} soru kaldı`
                  : 'Tamamlanmak üzere'}
              </span>
              <span aria-hidden>·</span>
              <span>Son işlem: {formatRelativeSonIslem(item.sonIslemTarihi)}</span>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
