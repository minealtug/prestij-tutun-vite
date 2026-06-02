import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="app-canvas relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-1/4 -top-1/4 h-[70%] w-[70%] rounded-full bg-primary-400/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[60%] w-[60%] rounded-full bg-accent-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
