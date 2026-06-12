import { apiClient } from '@/lib/api/api-client'
import type {
  CreateUserFormState,
  CreateUserRequest,
  DepartmanAdi,
  MintikaOptionDto,
  UpdateUserRequest,
  UserDto,
  UserTypeOptionDto,
} from '../types/user.types'
import { mapUserFromApi, mapUsersFromApi } from '../utils/normalize-user-api'
import {
  extractDepartmanAdlariFromUsers,
  uniqueDepartmanAdlari,
} from '../utils/departman-options'
import { mapCografiFiltreOptionsFromApi } from '@/features/survey-responses/utils/cografi-filtre'
import {
  mapDepartmanAdlariFromApi,
  mapUserTypesFromApi,
} from '../utils/normalize-user-lookups'
import { resolveDepartmanId } from '../utils/resolve-departman-id'
import { buildCreateUserRequest, buildUpdateUserRequest } from '../utils/validate-create-user'

async function fetchAllMintikas(): Promise<MintikaOptionDto[]> {
  const raw = await apiClient.get<unknown>('/api/CografiFiltre/options')
  return mapCografiFiltreOptionsFromApi(raw).mintikalar
    .map((item) => ({ id: item.id, adi: item.adi }))
    .sort((a, b) => a.adi.localeCompare(b.adi, 'tr-TR'))
}

export const usersApi = {
  getAll: async (): Promise<UserDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/User')
    return mapUsersFromApi(raw)
  },

  getById: async (id: number): Promise<UserDto | null> => {
    const raw = await apiClient.get<unknown>(`/api/User/${id}`)
    return mapUserFromApi(raw)
  },

  create: (payload: CreateUserRequest) => apiClient.post<UserDto>('/api/User', payload),

  createFromForm: async (form: CreateUserFormState): Promise<UserDto> => {
    const departmanId = await resolveDepartmanId(form.departmanAdi)
    return apiClient.post<UserDto>('/api/User', {
      ...buildCreateUserRequest(form),
      departmanId,
    })
  },

  update: (id: number, payload: UpdateUserRequest) =>
    apiClient.put<UserDto>(`/api/User/${id}`, payload),

  updateFromForm: async (id: number, form: CreateUserFormState): Promise<UserDto> => {
    const departmanId = await resolveDepartmanId(form.departmanAdi)
    const raw = await apiClient.put<unknown>(`/api/User/${id}`, {
      ...buildUpdateUserRequest(form),
      departmanId,
    })
    const mapped = mapUserFromApi(raw)
    if (mapped) return mapped

    const refetched = await usersApi.getById(id)
    if (!refetched) throw new Error('Güncellenen kullanıcı bulunamadı.')
    return refetched
  },

  getUserTypes: async (): Promise<UserTypeOptionDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/UserType')
    return mapUserTypesFromApi(raw)
      .filter((item) => item.active)
      .sort((a, b) => a.description.localeCompare(b.description, 'tr-TR'))
  },

  getDepartmans: async (): Promise<DepartmanAdi[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Departman')
    const fromApi = uniqueDepartmanAdlari(mapDepartmanAdlariFromApi(raw))

    if (fromApi.length > 0) return fromApi

    const users = await usersApi.getAll()
    return extractDepartmanAdlariFromUsers(users)
  },

  getMintikas: () => fetchAllMintikas(),
}
