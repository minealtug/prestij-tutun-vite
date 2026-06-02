import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { settingsApi } from '../api/settings-api'
import type { UpdateSettingsRequest } from '../types/settings.types'

export function useSettingsProfile() {
  return useQuery({
    queryKey: queryKeys.settings.profile,
    queryFn: () => settingsApi.getProfile(),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateSettingsRequest) => settingsApi.updateProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.profile })
    },
  })
}
