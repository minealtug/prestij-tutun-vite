import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, UserX, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import type { UserDto } from '@/features/users/types/user.types'
import {
  ADMIN_ACTIVITY_DAY_OPTIONS,
  type AdminActivityDayWindow,
  type AdminUserActivitySummary,
} from '../utils/admin-dashboard-stats'

interface AdminUserActivityCardProps {
  summary: AdminUserActivitySummary
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
  const [showNeverFilled, setShowNeverFilled] = useState(false)
  const previewUsers = summary.neverFilledUsers.slice(0, 8)

  return (
    <Card
      title="Kullanıcı aktivitesi"
      description="Aktiflik ve form doldurma durumu"
      interactive={false}
      accent
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            icon={Users}
            label="Aktif"
            value={summary.activeUsers}
            hint={`Toplam ${summary.totalUsers.toLocaleString('tr-TR')}`}
            isLoading={isLoading}
          />
          <Metric
            icon={UserX}
            label="Pasif"
            value={summary.passiveUsers}
            hint="Hesabı kapalı"
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
        <div className="w-full sm:w-40">
          <Select
            label="Pencere"
            value={String(dayWindow)}
            onChange={(e) => onDayWindowChange(Number(e.target.value) as AdminActivityDayWindow)}
            options={ADMIN_ACTIVITY_DAY_OPTIONS.map((days) => ({
              value: String(days),
              label: `Son ${days} gün`,
            }))}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Kullanıcılar yükleniyor…</p>
      ) : summary.neverFilled === 0 ? (
        <p className="text-sm text-muted">Tüm kullanıcıların en az bir form kaydı var.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Hiç form doldurmayanlar
            </p>
            <button
              type="button"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
              onClick={() => setShowNeverFilled((open) => !open)}
            >
              {showNeverFilled ? 'Gizle' : 'Listele'}
            </button>
          </div>

          {showNeverFilled ? (
            <ul className="divide-y divide-border/80 rounded-lg border border-border/80">
              {previewUsers.map((user) => (
                <NeverFilledRow key={user.id} user={user} />
              ))}
            </ul>
          ) : null}

          {showNeverFilled && summary.neverFilled > previewUsers.length ? (
            <Link
              to="/users"
              className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Tümünü kullanıcılar sayfasında gör ({summary.neverFilled})
            </Link>
          ) : null}
        </div>
      )}
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

function NeverFilledRow({ user }: { user: UserDto }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {user.fullName.trim() || user.userName}
        </p>
        <p className="truncate text-xs text-muted">
          {[user.userName, user.mintikaAdi, user.departmanAdi].filter(Boolean).join(' · ')}
        </p>
      </div>
      <span
        className={
          user.aktif
            ? 'shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
            : 'shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-700'
        }
      >
        {user.aktif ? 'Aktif' : 'Pasif'}
      </span>
    </li>
  )
}
