import { UserRound, UserX, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  ADMIN_ACTIVITY_DAY_OPTIONS,
  type AdminActivityDayWindow,
  type AdminEkiciActivitySummary,
} from '../utils/admin-dashboard-stats'

interface AdminUserActivityCardProps {
  summary: AdminEkiciActivitySummary
  dayWindow: AdminActivityDayWindow
  onDayWindowChange: (value: AdminActivityDayWindow) => void
  isLoading?: boolean
}

export function AdminUserActivityCard({
  summary,
  dayWindow,
  onDayWindowChange,
  isLoading = false,
}: AdminUserActivityCardProps) {
  return (
    <Card interactive={false} accent>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Ekici aktivitesi</h3>
        <div className="mt-2 w-full sm:max-w-xs">
          <Select
            value={String(dayWindow)}
            onChange={(e) => onDayWindowChange(Number(e.target.value) as AdminActivityDayWindow)}
            options={ADMIN_ACTIVITY_DAY_OPTIONS.map((days) => ({
              value: String(days),
              label: `Son ${days} gün`,
            }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Aktif"
          value={summary.activeEkiciler}
          hint={`Toplam ${summary.totalEkiciler.toLocaleString('tr-TR')}`}
          isLoading={isLoading}
        />
        <Metric
          icon={UserX}
          label="Pasif"
          value={summary.passiveEkiciler}
          hint="Kayıt pasif"
          isLoading={isLoading}
        />
        <Metric
          icon={UserRound}
          label={`Son ${dayWindow} günde dolduran`}
          value={summary.filledInWindow}
          hint="En az bir form işlemi"
          isLoading={isLoading}
        />
        <Metric
          icon={UserX}
          label="Hiç doldurmayan"
          value={summary.neverFilled}
          hint="Form kaydı yok"
          isLoading={isLoading}
          tone="amber"
        />
      </div>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  isLoading,
  tone = 'default',
}: {
  icon: typeof Users
  label: string
  value: number
  hint: string
  isLoading: boolean
  tone?: 'default' | 'amber'
}) {
  return (
    <div
      className={
        tone === 'amber'
          ? 'rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5'
          : 'rounded-lg border border-border/80 bg-surface-elevated/60 px-3 py-2.5'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">
        {isLoading ? '…' : value.toLocaleString('tr-TR')}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
    </div>
  )
}

