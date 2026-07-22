import { Link } from 'react-router-dom'
import { BarChart3, ChevronRight, Database, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'

const REPORTS = [
  {
    to: '/raporlar/yas-cinsiyet',
    title: 'Yaş–Cinsiyet Raporu',
    description:
      'Yetiştirici, hane ve üretim verilerini birleştirerek nüfus piramidi, yaş dağılımı ve hane yapısı analizi.',
    icon: Users,
    accent: 'from-primary-600 to-accent-500',
    tags: ['KPI', 'Piramit', 'Karşılaştırma'],
  },
  {
    to: '/raporlar/ham-veri',
    title: 'Ham Veri Raporu',
    description:
      'Yetiştirici, hane ve üretim verilerinin filtrelenmemiş satır bazlı dökümü.',
    icon: Database,
    accent: 'from-primary-600 to-accent-500',
    tags: ['Tablo', 'Ham Veri', 'Dışa Aktarım'],
  },
] as const

export function ReportsPage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yükleniyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  return (
    <PageContainer>
      <section className="gradient-brand rounded-xl px-6 py-6 shadow-lg md:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <BarChart3 className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">Raporlar</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/80">
              Demografik, üretim ve anket verilerini görselleştiren analiz panelleri.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Link key={report.to} to={report.to} className="group block">
            <Card
              interactive
              className="relative h-full overflow-hidden transition-all group-hover:border-primary-300/60"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${report.accent}`}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
                  <report.icon className="h-5 w-5" aria-hidden />
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary-700">
                {report.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{report.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {report.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
