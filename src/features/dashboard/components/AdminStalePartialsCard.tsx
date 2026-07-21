import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { getOzetFullName } from '@/features/survey-responses/types/survey-response.types'
import { formatRelativeSonIslem } from '../utils/user-dashboard-survey-groups'
import type { AdminStalePartialRow } from '../utils/admin-dashboard-stats'

interface AdminStalePartialsCardProps {
  rows: AdminStalePartialRow[]
  staleCount: number
  isLoading?: boolean
}

export function AdminStalePartialsCard({
  rows,
  staleCount,
  isLoading = false,
}: AdminStalePartialsCardProps) {
  return (
    <Card
      className="border-orange-200/80 bg-orange-50/15"
      title="Yarım form uyarısı"
      description="Bir haftadan uzun süredir güncellenmeyen yarım kayıtlar"
      accent
    >
      {isLoading ? (
        <p className="text-sm text-muted">Yarım formlar yükleniyor…</p>
      ) : rows.length > 0 ? (
        <div className="space-y-3">
          <div
            className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900"
            role="status"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">{staleCount.toLocaleString('tr-TR')} form</span> bir
              haftadan uzun süredir yarım — öncelikli kayıtlar aşağıda.
            </p>
          </div>

          <div className="-mx-5 overflow-x-auto border-t border-orange-100">
            <table className="app-table app-table-compact min-w-[720px]">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Ekici</th>
                  <th>Anket</th>
                  <th>Mıntıka</th>
                  <th className="w-36">Son işlem</th>
                  <th className="w-28 text-center">Bekleme</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.item.id} className="app-table-row--in-progress">
                    <td className="font-medium">{row.kullaniciAdi}</td>
                    <td>{getOzetFullName(row.item)}</td>
                    <td>{row.anketAdi}</td>
                    <td>{row.item.mintikaAdi?.trim() || '—'}</td>
                    <td>{formatRelativeSonIslem(row.item.sonIslemTarihi)}</td>
                    <td className="text-center">
                      <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800">
                        {row.daysSince != null ? `${row.daysSince}+ gün` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          compact
          icon={CheckCircle2}
          title="Eskiyen yarım form yok"
          description="Bir haftadan eski yarım kayıt bulunmuyor."
        />
      )}
    </Card>
  )
}
