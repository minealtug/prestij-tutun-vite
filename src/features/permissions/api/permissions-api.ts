import { apiClient } from '@/lib/api/api-client'
import type {
  AddMenuPayload,
  AddYetkiPayload,
  MenuAtamaDto,
  MenuDto,
  RolYetkiDto,
  UpdateMenuPayload,
  YetkiDto,
} from '../types/permission.types'
import {
  mapDepartmansFromApi,
  mapMenuAtamalarFromApi,
  mapMenusFromApi,
  mapYetkilerFromApi,
} from '../utils/normalize-permission-api'
import { buildMenuPermissionMap } from '../utils/permission-logic'
import type { MenuPermissionMap } from '../types/permission.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function mapAssignedYetkiIdsFromApi(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
  }

  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const list = pick<unknown[]>(row, 'yetkiIds', 'YetkiIds', 'yetkiIdler', 'YetkiIdler') ?? []

  return [...new Set(list.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
}

export const permissionsApi = {
  getMenus: async (): Promise<MenuDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Menu')
    return mapMenusFromApi(raw)
  },

  getYetkiler: async (): Promise<YetkiDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Yetki')
    return mapYetkilerFromApi(raw)
  },

  getDepartmans: async () => mapDepartmansFromApi(await apiClient.get<unknown[]>('/api/Departman')),

  getMenuAtamalari: async (menuUrl: string): Promise<MenuAtamaDto[]> =>
    mapMenuAtamalarFromApi(
      await apiClient.get<unknown[]>('/api/RolYetki/menu', { menuUrl }),
    ),

  getAssignedYetkiIds: async (): Promise<number[]> => {
    const raw = await apiClient.get<unknown>('/api/RolYetki/assigned-yetkiler')
    return mapAssignedYetkiIdsFromApi(raw)
  },

  createYetki: (payload: AddYetkiPayload) =>
    apiClient.post<YetkiDto>('/api/Yetki', { yetkiTuru: payload.yetkiTuru }),

  createMenu: (payload: AddMenuPayload) =>
    apiClient.post<MenuDto>('/api/Menu', {
      menuAdi: payload.menuAdi,
      menuUrl: payload.menuUrl,
      yetkiId: payload.yetkiId,
    }),

  updateMenu: (id: number, payload: UpdateMenuPayload) =>
    apiClient.put<MenuDto>(`/api/Menu/${id}`, {
      menuAdi: payload.menuAdi,
      menuUrl: payload.menuUrl,
      yetkiId: payload.yetkiId,
    }),

  deleteMenu: (id: number) => apiClient.delete<void>(`/api/Menu/${id}`),

  addDepartmanRolYetki: (departmanId: number, yetkiId: number) =>
    apiClient.post<RolYetkiDto>('/api/RolYetki/departman', { departmanId, yetkiId }),

  addUserRolYetki: (userId: number, yetkiId: number) =>
    apiClient.post<RolYetkiDto>('/api/RolYetki/user', { userId, yetkiId }),

  deleteDepartmanRolYetki: (departmanId: number, yetkiId: number) =>
    apiClient.delete<void>(`/api/RolYetki/departman/${departmanId}/${yetkiId}`),

  deleteUserRolYetki: (userId: number, yetkiId: number) =>
    apiClient.delete<void>(`/api/RolYetki/user/${userId}/${yetkiId}`),

  updateDepartmanRolYetki: (departmanId: number, yetkiIdler: number[]) =>
    apiClient.put<{ message: string }>('/api/RolYetki/departman', { departmanId, yetkiIdler }),

  updateUserRolYetki: (userId: number, yetkiIdler: number[]) =>
    apiClient.put<{ message: string }>('/api/RolYetki/user', { userId, yetkiIdler }),

  async loadMenuPermissionMap(): Promise<MenuPermissionMap> {
    const [menus, yetkiler] = await Promise.all([
      permissionsApi.getMenus(),
      permissionsApi.getYetkiler(),
    ])
    return buildMenuPermissionMap(menus, yetkiler)
  },
}
