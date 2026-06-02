import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: ReactNode
  accent?: boolean
  /** Hover gölge efekti (varsayılan: açık) */
  interactive?: boolean
}

export function Card({
  className,
  title,
  description,
  footer,
  accent = false,
  interactive = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-5',
        interactive && 'hover:-translate-y-px',
        accent && 'border-l-4 border-l-primary-400',
        className,
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      )}
      {children}
      {footer && <div className="mt-4 border-t border-border/80 pt-4">{footer}</div>}
    </div>
  )
}
