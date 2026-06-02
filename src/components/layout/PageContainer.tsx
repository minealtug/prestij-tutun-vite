import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/** Sayfa içi dikey boşluk: 24px (mobil) / 32px (lg+) */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('page-stack', className)}>{children}</div>
}
