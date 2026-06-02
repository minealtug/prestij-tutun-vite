import { apiClient } from '@/lib/api/api-client'
import type { PagedResult } from '@/lib/api/types'
import type { UserDto, UsersQueryParams } from '../types/user.types'

export const usersApi = {
  getPaged: (params?: UsersQueryParams) =>
    apiClient.get<PagedResult<UserDto>>('/users', params as Record<string, unknown>),

  getById: (id: string) => apiClient.get<UserDto>(`/users/${id}`),
}
