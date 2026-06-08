import { apiClient } from '@/lib/api/api-client'
import type {
  CreateUserFormState,
  CreateUserRequest,
  DepartmanAdi,
  MintikaOptionDto,
  UserDto,
  UserTypeOptionDto,
} from '../types/user.types'
import { mapUserFromApi, mapUsersFromApi } from '../utils/normalize-user-api'
import {
  extractDepartmanAdlariFromUsers,
  uniqueDepartmanAdlari,
} from '../utils/departman-options'
import {
  mapDepartmanAdlariFromApi,
  mapMintikasFromApi,
  mapUserTypesFromApi,
} from '../utils/normalize-user-lookups'
import { resolveDepartmanId } from '../utils/resolve-departman-id'
import { buildCreateUserRequest } from '../utils/validate-create-user'
function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function readId(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = row.id ?? row.Id
  const num = Number(id)
  return Number.isFinite(num) ? num : null
}

async function fetchAllMintikas(): Promise<MintikaOptionDto[]> {
  const menseilerRaw = await apiClient.get<unknown[]>('/api/Mensei')
  const menseiIds = menseilerRaw.map(readId).filter((id): id is number => id !== null)

  const bolgeLists = await Promise.all(
    menseiIds.map((id) => apiClient.get<unknown[]>(`/api/Mensei/${id}/Bolge`)),
  )
  const bolgeIds = uniqueById(
    bolgeLists.flat().map((item) => ({ id: readId(item) ?? -1 })).filter((item) => item.id > 0),
  )

  const mintikaLists = await Promise.all(
    bolgeIds.map((b) => apiClient.get<unknown[]>(`/api/Bolge/${b.id}/Mintika`)),
  )
  return mapMintikasFromApi(mintikaLists.flat()).sort((a, b) =>
    a.adi.localeCompare(b.adi, 'tr-TR'),
  )
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
