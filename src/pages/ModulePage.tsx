import { useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { pageTitles } from '@/config/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Wrench } from 'lucide-react'

export function ModulePage() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Modül'

  return (
    <PageContainer>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted">
          Bu modül .NET API bağlandığında aktif olacaktır. Mock veri kullanılmaz.
        </p>
      </div>

      <Card>
        <EmptyState
          icon={Wrench}
          title="Modül hazırlanıyor"
          description="Endpoint ve ekran detayları backend sözleşmesi netleşince bu alana eklenecek."
        />
      </Card>
    </PageContainer>
  )
}
