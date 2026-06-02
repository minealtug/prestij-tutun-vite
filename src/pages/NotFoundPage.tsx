import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
        <FileQuestion className="h-10 w-10" />
      </div>
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-foreground">Sayfa bulunamadı</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link to="/" className="mt-6">
        <Button>Ana sayfaya dön</Button>
      </Link>
    </div>
  )
}
