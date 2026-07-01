import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { formatSonIslemTarihi } from '@/features/survey-responses/utils/map-anket-cevap'
import {
  buildSurveyFillLinkFromOzet,
  formatRelativeSonIslem,
  getItemProgressPercent,
  getSurveyListSubtitle,
  getSurveyListTitle,
} from '../utils/user-dashboard-survey-groups'

type FormStatusTab = 'completed' | 'partial'

interface UserFormStatusTableCardProps {
  completedForms: AnketCevapOzetItem[]
  partialForms: AnketCevapOzetItem[]
  isLoading?: boolean
}

const TAB_LABELS: Record<FormStatusTab, string> = {
  completed: 'Tamamlanan',
  partial: 'Tamamlanmayan',
}

function getRowClassName(tab: FormStatusTab): string {
  return tab === 'completed' ? 'app-table-row--completed' : 'app-table-row--in-progress'
}

export function UserFormStatusTableCard({
  completedForms,
  partialForms,
  isLoading = false,
}: UserFormStatusTableCardProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FormStatusTab>('partial')

  const visibleForms = useMemo(
    () => (activeTab === 'completed' ? completedForms : partialForms),
    [activeTab, completedForms, partialForms],
  )

  return (
    <Card
      className="overflow-hidden"
      title="Form durumu"
      description="Tamamlanan ve tamamlanmayan ekici formlarınız"
      accent
      interactive={false}
    >
      <div className="flex flex-wrap gap-2 pb-4">
        {(['partial', 'completed'] as const).map((tab) => {
          const count = tab === 'completed' ? completedForms.length : partialForms.length
          const isActive = activeTab === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? tab === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-yellow-400 text-yellow-950 shadow-sm'
                  : 'border border-border bg-surface-elevated text-foreground hover:bg-primary-50',
              )}
            >
              {TAB_LABELS[tab]} ({count.toLocaleString('tr-TR')})
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted">Formlar yükleniyor…</p>
      ) : visibleForms.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {TAB_LABELS[activeTab]} form bulunmuyor.
        </p>
      ) : (
        <div className="-mx-5 -mb-5 mt-4 overflow-x-auto border-t border-border/80">
          <table className="app-table app-table-compact min-w-[720px]">
            <thead>
              <tr>
                <th>EKİCİ</th>
                <th>ANKET</th>
                <th className="w-28 text-center">İLERLEME</th>
                <th className="w-36">SON İŞLEM</th>
                {activeTab === 'partial' ? <th className="w-28 text-center">İŞLEM</th> : null}
              </tr>
            </thead>
            <tbody>
              {visibleForms.map((item) => {
                const progress = getItemProgressPercent(item)
                const fillLink = buildSurveyFillLinkFromOzet(item)

                return (
                  <tr key={item.id} className={getRowClassName(activeTab)}>
                    <td className="max-w-[220px] truncate font-medium">{getSurveyListSubtitle(item)}</td>
                    <td className="max-w-[180px] truncate">{getSurveyListTitle(item)}</td>
                    <td className="text-center font-medium">
                      {activeTab === 'completed' ? '%100' : `%${progress}`}
                    </td>
                    <td className="whitespace-nowrap text-muted">
                      {formatRelativeSonIslem(item.sonIslemTarihi)}
                      <span className="mt-0.5 block text-[11px]">
                        {formatSonIslemTarihi(item.sonIslemTarihi)}
                      </span>
                    </td>
                    {activeTab === 'partial' ? (
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(fillLink ?? '/anket-doldurma')}
                        >
                          Devam
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
