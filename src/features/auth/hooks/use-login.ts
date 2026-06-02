import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth-api'
import { isDevAuthEnabled, tryDevLogin } from '../dev/dev-auth'
import { useAuthStore } from '@/stores/auth-store'
import type { LoginRequest } from '../types/auth.types'
import { getErrorMessage } from '@/lib/api/api-error'
import type { AppError } from '@/lib/api/api-error'

async function loginWithApiOrDev(payload: LoginRequest) {
  if (isDevAuthEnabled()) {
    const devSession = tryDevLogin(payload)
    if (devSession) return devSession

    const invalid: AppError = {
      status: 401,
      message: 'Geçersiz test kullanıcısı. Giriş kutusundaki e-posta ve şifreyi kullanın.',
      isNetworkError: false,
    }
    throw invalid
  }

  return authApi.login(payload)
}

export function useLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginWithApiOrDev(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
      })
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    },
  })
}

export function getLoginFieldError(error: unknown, field: string): string | undefined {
  if (typeof error === 'object' && error !== null && 'fieldErrors' in error) {
    const errors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors
    return errors?.[field]?.[0]
  }
  return undefined
}

export function getLoginErrorMessage(error: unknown): string {
  return getErrorMessage(error)
}
