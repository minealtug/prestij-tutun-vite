import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { permissionsApi } from '../api/permissions-api'
import type { AddMenuPayload, AddYetkiPayload, UpdateMenuPayload } from '../types/permission.types'
import { invalidateAssignedCache, usePermissionsStore } from '../stores/permissions-store'

function refreshPermissionsAfterMutation() {
  invalidateAssignedCache()
  usePermissionsStore.getState().requestReload()
}

export function usePermissionMenus() {
  return useQuery({
    queryKey: queryKeys.permissions.menus,
    queryFn: permissionsApi.getMenus,
  })
}

export function usePermissionYetkiler() {
  return useQuery({
    queryKey: queryKeys.permissions.yetkiler,
    queryFn: permissionsApi.getYetkiler,
  })
}

export function usePermissionDepartmans() {
  return useQuery({
    queryKey: queryKeys.permissions.departmans,
    queryFn: permissionsApi.getDepartmans,
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['permissions'] })
}

export function useCreateYetki() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddYetkiPayload) => permissionsApi.createYetki(payload),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddMenuPayload) => permissionsApi.createMenu(payload),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMenuPayload }) =>
      permissionsApi.updateMenu(id, payload),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => permissionsApi.deleteMenu(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useAddDepartmanRolYetki() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ departmanId, yetkiId }: { departmanId: number; yetkiId: number }) =>
      permissionsApi.addDepartmanRolYetki(departmanId, yetkiId),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useAddUserRolYetki() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, yetkiId }: { userId: number; yetkiId: number }) =>
      permissionsApi.addUserRolYetki(userId, yetkiId),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useDeleteDepartmanRolYetki() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ departmanId, yetkiId }: { departmanId: number; yetkiId: number }) =>
      permissionsApi.deleteDepartmanRolYetki(departmanId, yetkiId),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}

export function useDeleteUserRolYetki() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, yetkiId }: { userId: number; yetkiId: number }) =>
      permissionsApi.deleteUserRolYetki(userId, yetkiId),
    onSuccess: () => {
      invalidateAll(queryClient)
      refreshPermissionsAfterMutation()
    },
  })
}
