import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { usersApi } from '../api/users-api'
import type { UsersQueryParams } from '../types/user.types'

export function useUsers(params?: UsersQueryParams) {
  return useQuery({
    queryKey: queryKeys.users.all(params),
    queryFn: () => usersApi.getPaged(params),
  })
}
