import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PageLoader } from './PageLoader'
import { ErrorState } from './ErrorState'
import { SkeletonStatCards, SkeletonActivityList } from './Skeleton'

type LoadingVariant = 'spinner' | 'skeleton-stats' | 'skeleton-activity' | 'skeleton-table'
type ErrorVariant = 'default' | 'compact'

interface QueryBoundaryProps {
  query: Pick<UseQueryResult, 'isLoading' | 'isError' | 'error' | 'refetch' | 'isFetching'>
  children: ReactNode
  loadingLabel?: string
  errorTitle?: string
  loadingVariant?: LoadingVariant
  errorVariant?: ErrorVariant
}

export function QueryBoundary({
  query,
  children,
  loadingLabel,
  errorTitle,
  loadingVariant = 'spinner',
  errorVariant = 'default',
}: QueryBoundaryProps) {
  if (query.isLoading) {
    if (loadingVariant === 'skeleton-stats') return <SkeletonStatCards />
    if (loadingVariant === 'skeleton-activity') return <SkeletonActivityList />
    if (loadingVariant === 'skeleton-table') {
      return (
        <div className="glass-card space-y-3 !p-4 hover:translate-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-border/80" />
          ))}
        </div>
      )
    }
    return <PageLoader label={loadingLabel} compact={errorVariant === 'compact'} />
  }

  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        title={errorTitle}
        onRetry={() => void query.refetch()}
        compact={errorVariant === 'compact'}
      />
    )
  }

  return <>{children}</>
}
