import { apiClient } from '@/lib/api/api-client'
import type { AuthMeResponse, LoginRequest, LoginResponse } from '../types/auth.types'
import { normalizeAuthMeResponse, normalizeLoginResponse } from '../utils/normalize-login-response'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const raw = await apiClient.post<unknown>('/api/Auth/login', {
      userName: payload.userName,
      password: payload.password,
    })
    return normalizeLoginResponse(raw)
  },

  me: async (): Promise<AuthMeResponse> => {
    const raw = await apiClient.get<unknown>('/api/Auth/me')
    return normalizeAuthMeResponse(raw)
  },
}
