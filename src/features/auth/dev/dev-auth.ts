import type { LoginRequest, LoginResponse } from '../types/auth.types'

/** Geçici geliştirme kullanıcısı — yalnızca DEV + VITE_DEV_AUTH_ENABLED=true */
export const DEV_TEST_CREDENTIALS = {
  email: 'admin@prestij.com',
  password: 'Test123!',
} as const

export function isDevAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
}

export function tryDevLogin(payload: LoginRequest): LoginResponse | null {
  if (!isDevAuthEnabled()) return null

  const email = payload.email.trim().toLowerCase()
  const password = payload.password

  if (
    email !== DEV_TEST_CREDENTIALS.email.toLowerCase() ||
    password !== DEV_TEST_CREDENTIALS.password
  ) {
    return null
  }

  return {
    accessToken: 'dev-temporary-token',
    expiresIn: 86_400,
    user: {
      id: 'dev-user-1',
      email: DEV_TEST_CREDENTIALS.email,
      fullName: 'Test Admin',
      role: 'Admin',
    },
  }
}
