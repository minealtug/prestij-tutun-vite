import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, Database, Users } from 'lucide-react'
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
  {
    to: '/raporlar/anket-cevaplari',
    title: 'Anket Cevap Raporu',
    description:
      'Seçilen ankete verilen tüm cevapların ekici bilgileriyle birlikte satır bazlı dökümü.',
    icon: ClipboardList,
    accent: 'from-primary-600 to-accent-500',
    tags: ['Anket', 'Cevaplar', 'Dışa Aktarım'],
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
