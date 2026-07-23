import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import type { AdminGeoComparisonRow } from '../utils/admin-dashboard-stats'

type GeoView = 'mintika' | 'bolge'

interface AdminGeoComparisonCardProps {
  mintikaRows: AdminGeoComparisonRow[]
  bolgeRows: AdminGeoComparisonRow[]
  isLoading?: boolean
}

const VIEW_LABELS: Record<GeoView, string> = {
  mintika: 'Mıntıka',
  bolge: 'Bölge',
}

export function AdminGeoComparisonCard({
  mintikaRows,
  bolgeRows,
  isLoading = false,
}: AdminGeoComparisonCardProps) {
  const [view, setView] = useState<GeoView>('mintika')
  const rows = view === 'mintika' ? mintikaRows : bolgeRows

  const chartData = useMemo(
    () =>
      rows.slice(0, 8).map((row) => ({
        name: row.label.length > 14 ? `${row.label.slice(0, 14)}…` : row.label,
        fullName: row.label,
        tamamlanan: row.completed,
        yarim: row.partial,
        oran: row.completionPercent,
      })),
    [rows],
  )

  return (
    <Card
      title="Mıntıka / bölge karşılaştırması"
      description="Seçili coğrafi filtreye göre form doluluk oranları"
      interactive={false}
      accent
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(['mintika', 'bolge'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setView(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              view === tab
                ? 'bg-primary-600 text-white shadow-sm'
                : 'border border-border bg-surface-elevated text-foreground hover:bg-primary-50',
            )}
          >
            {VIEW_LABELS[tab]} ({tab === 'mintika' ? mintikaRows.length : bolgeRows.length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted">Karşılaştırma yükleniyor…</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Bu filtre için karşılaştırılacak form kaydı yok.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    Number(value ?? 0).toLocaleString('tr-TR'),
                    name === 'tamamlanan' ? 'Tamamlanan' : name === 'yarim' ? 'Yarım' : String(name),
                  ]}
                  labelFormatter={(_, payload) => {
                    const full = payload?.[0]?.payload?.fullName
                    return typeof full === 'string' ? full : ''
                  }}
                />
                <Bar dataKey="tamamlanan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yarim" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="-mx-5 overflow-x-auto border-t border-border/80">
            <table className="app-table app-table-compact min-w-[520px]">
              <thead>
                <tr>
                  <th>{VIEW_LABELS[view]}</th>
                  <th className="w-24 text-center">Tamamlanan</th>
                  <th className="w-24 text-center">Yarım</th>
                  <th className="w-24 text-center">Toplam</th>
                  <th className="w-28 text-center">Doluluk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className="font-medium">{row.label}</td>
                    <td className="text-center">{row.completed.toLocaleString('tr-TR')}</td>
                    <td className="text-center">{row.partial.toLocaleString('tr-TR')}</td>
                    <td className="text-center">{row.total.toLocaleString('tr-TR')}</td>
                    <td className="text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                          row.completionPercent >= 70
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : row.completionPercent >= 40
                              ? 'bg-amber-500/15 text-amber-800'
                              : 'bg-red-500/15 text-red-700',
                        )}
                      >
                        %{row.completionPercent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
