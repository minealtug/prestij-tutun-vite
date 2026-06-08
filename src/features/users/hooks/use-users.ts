import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { usersApi } from '../api/users-api'
import type { CreateUserFormState } from '../types/user.types'

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: () => usersApi.getAll(),
  })
}

export function useUserTypes() {
  return useQuery({
    queryKey: queryKeys.users.userTypes,
    queryFn: () => usersApi.getUserTypes(),
  })
}

export function useDepartmans(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.departmans,
    queryFn: () => usersApi.getDepartmans(),
    enabled,
  })
}

export function useMintikas() {
  return useQuery({
    queryKey: queryKeys.users.mintikas,
    queryFn: () => usersApi.getMintikas(),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (form: CreateUserFormState) => usersApi.createFromForm(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.departmans })
    },
  })
}
