import { apiClient } from '@/lib/api/api-client'
import type { LoginRequest, LoginResponse } from '../types/auth.types'

export const authApi = {
  login: (payload: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', payload),

  me: () => apiClient.get<LoginResponse['user']>('/auth/me'),

  logout: () => apiClient.post<void>('/auth/logout'),
}
