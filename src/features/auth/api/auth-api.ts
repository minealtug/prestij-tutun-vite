import { apiClient } from '@/lib/api/api-client'
import type { AuthMeResponse, LoginRequest, LoginResponse } from '../types/auth.types'
import { resolveMintikaIdFromUserProfile } from '../utils/enrich-auth-user-mintika'
import { normalizeAuthMeResponse, normalizeLoginResponse } from '../utils/normalize-login-response'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const raw = await apiClient.post<unknown>('/api/Auth/login', {
      userName: payload.userName,
      password: payload.password,
    })
    const response = normalizeLoginResponse(raw)
    const mintikaId = await resolveMintikaIdFromUserProfile(
      response.user.id,
      response.user.mintikaId,
    )
    return {
      ...response,
      user: { ...response.user, mintikaId },
    }
  },

  me: async (): Promise<AuthMeResponse> => {
    const raw = await apiClient.get<unknown>('/api/Auth/me')
    const response = normalizeAuthMeResponse(raw)
    const mintikaId = await resolveMintikaIdFromUserProfile(
      response.user.id,
      response.user.mintikaId,
    )
    return {
      ...response,
      user: { ...response.user, mintikaId },
    }
  },
}
