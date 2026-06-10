import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import type { LoginRequest } from '../types/auth.types'
import { getLoginExpiresAtMs } from '../utils/normalize-login-response'
import { getErrorMessage } from '@/lib/api/api-error'

export function useLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(
        data.accessToken,
        {
          id: data.user.id,
          userName: data.user.userName,
          email: data.user.email,
          fullName: data.user.fullName,
          role: data.user.role,
          admin: data.user.admin,
          departmanId: data.user.departmanId,
          departmanAdi: data.user.departmanAdi,
        },
        getLoginExpiresAtMs(data),
      )
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
