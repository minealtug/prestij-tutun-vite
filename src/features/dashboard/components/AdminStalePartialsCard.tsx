import { useState } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { isAppError } from '@/lib/api/api-error'
import { useYarimFormUyarisi } from '@/features/survey-responses/hooks/use-survey-responses'
import type { YarimFormUyarisiKayit } from '@/features/survey-responses/types/yarim-form-uyarisi.types'
import { UnansweredQuestionsWarning } from './UnansweredQuestionsWarning'
import { formatRelativeSonIslem } from '../utils/user-dashboard-survey-groups'

const LIST_LIMIT = 10

function ekiciAdi(row: YarimFormUyarisiKayit): string {
  return [row.ekiciAd, row.ekiciSoyad].filter(Boolean).join(' ').trim() || '—'
}

export function AdminStalePartialsCard() {
  const [showAll, setShowAll] = useState(false)
  const uyarisiQuery = useYarimFormUyarisi()
  const rows = uyarisiQuery.data?.kayitlar ?? []
  const staleCount = uyarisiQuery.data?.adet ?? 0
  const hasMore = rows.length > LIST_LIMIT
  const visibleRows = showAll || !hasMore ? rows : rows.slice(0, LIST_LIMIT)
  const missingMintika =
    uyarisiQuery.isError && isAppError(uyarisiQuery.error) && uyarisiQuery.error.status === 400

  return (
    <Card
      className="border-orange-200/80 bg-orange-50/15"
      title="Yarım form uyarısı"
      description="Bir haftadan uzun süredir güncellenmeyen yarım kayıtlar"
      accent
    >
      {uyarisiQuery.isLoading ? (
        <p className="text-sm text-muted">Yarım formlar yükleniyor…</p>
      ) : missingMintika ? (
        <EmptyState
          compact
          icon={CircleAlert}
          title="Yarım form uyarısı gösterilemedi"
          description="Tanımlı mıntıka bulunamadı."
        />
      ) : uyarisiQuery.isError ? (
        <ErrorState
          error={uyarisiQuery.error}
          title="Yarım form uyarısı yüklenemedi"
          onRetry={() => void uyarisiQuery.refetch()}
          compact
        />
      ) : rows.length > 0 ? (
        <div className="space-y-3">
          <div
            className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900"
            role="status"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">{staleCount.toLocaleString('tr-TR')} form</span> bir
              haftadan uzun süredir yarım — hangi soruların boş kaldığı aşağıda.
            </p>
          </div>

          {hasMore ? (
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-xs text-muted">
                Göster
                <select
                  className="rounded-md border border-orange-200 bg-white px-2 py-1 text-sm text-foreground"
                  value={showAll ? 'all' : '10'}
                  onChange={(event) => setShowAll(event.target.value === 'all')}
                >
                  <option value="10">İlk 10</option>
                  <option value="all">Tümü ({rows.length.toLocaleString('tr-TR')})</option>
                </select>
              </label>
            </div>
          ) : null}

          <div
            className={`-mx-5 overflow-x-auto border-t border-orange-100 ${
              showAll && hasMore ? 'max-h-[28rem] overflow-y-auto' : ''
            }`}
          >
            <table
              className={`app-table app-table-compact min-w-[56rem] ${
                showAll && hasMore ? 'app-table-sticky-header' : ''
              }`}
            >
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Ekici</th>
                  <th>Anket</th>
                  <th>Mıntıka</th>
                  <th className="min-w-[16rem]">Eksik sorular</th>
                  <th className="w-36">Son işlem</th>
                  <th className="w-28 text-center">Bekleme</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="app-table-row--in-progress">
                    <td className="font-medium">{row.kullaniciAdi.trim() || '—'}</td>
                    <td>{ekiciAdi(row)}</td>
                    <td>{row.anketAdi.trim() || '—'}</td>
                    <td>{row.mintikaAdi.trim() || '—'}</td>
                    <td>
                      <UnansweredQuestionsWarning
                        questions={row.eksikSorular}
                        unansweredCount={row.yanitlanmayanSoruSayisi}
                      />
                    </td>
                    <td>{formatRelativeSonIslem(row.sonIslemTarihi)}</td>
                    <td className="text-center">
                      <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800">
                        {row.beklemeGunu != null ? `${row.beklemeGunu} gün` : '—'}
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
