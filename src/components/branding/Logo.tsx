import logoSrc from '@/assets/logo.png'
import { cn } from '@/lib/utils/cn'

type LogoVariant = 'login' | 'sidebar' | 'sidebarCollapsed'

const variantClass: Record<LogoVariant, string> = {
  login: 'h-24 w-auto max-w-[260px] object-contain sm:h-28',
  sidebar: 'h-10 w-auto max-w-[160px] object-contain object-left',
  sidebarCollapsed: 'h-9 w-9 object-contain object-center',
}

interface LogoProps {
  variant?: LogoVariant
  className?: string
}

export function Logo({ variant = 'login', className }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt={import.meta.env.VITE_APP_NAME}
      className={cn(variantClass[variant], className)}
      decoding="async"
    />
  )
}
