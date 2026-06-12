import { usersApi } from '@/features/users/api/users-api'

export async function resolveMintikaIdFromUserProfile(
  userId: string | number,
  currentMintikaId?: number | null,
): Promise<number | null> {
  if (currentMintikaId != null && currentMintikaId > 0) return currentMintikaId

  const id = Number(userId)
  if (!Number.isFinite(id) || id <= 0) return currentMintikaId ?? null

  const profile = await usersApi.getById(id)
  return profile?.mintikaId ?? null
}
