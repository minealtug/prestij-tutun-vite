import type { LoginRequest, LoginResponse } from '../types/auth.types'

/** Geçici geliştirme kullanıcısı — yalnızca DEV + VITE_DEV_AUTH_ENABLED=true */
export const DEV_TEST_CREDENTIALS = {
  userName: 'admin',
  password: 'Test123!',
} as const

export function isDevAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
}

export function tryDevLogin(payload: LoginRequest): LoginResponse | null {
  if (!isDevAuthEnabled()) return null

  const userName = payload.userName.trim()
  const password = payload.password

  if (
    userName !== DEV_TEST_CREDENTIALS.userName ||
    password !== DEV_TEST_CREDENTIALS.password
  ) {
    return null
  }

  return {
    accessToken: 'dev-temporary-token',
    expiresIn: 8 * 60 * 60,
    user: {
      id: 'dev-user-1',
      userName: DEV_TEST_CREDENTIALS.userName,
      email: 'admin@prestij.com',
      fullName: 'Test Admin',
      role: 'Admin',
      admin: true,
      departmanId: null,
      departmanAdi: null,
    },
  }
}
