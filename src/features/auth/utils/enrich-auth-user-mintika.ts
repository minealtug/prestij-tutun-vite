import { usersApi } from '@/features/users/api/users-api'
import { resolveMintikaIds } from '@/features/users/utils/resolve-mintika-ids'

export async function resolveMintikaFromUserProfile(
  userId: string | number,
  current?: {
    mintikaId?: number | null
    mintikaIds?: number[] | null
  },
): Promise<{ mintikaId: number | null; mintikaIds: number[] }> {
  if (Array.isArray(current?.mintikaIds)) {
    const mintikaIds = resolveMintikaIds(current)
    return {
      mintikaId: mintikaIds[0] ?? current.mintikaId ?? null,
      mintikaIds,
    }
  }

  const id = Number(userId)
  if (!Number.isFinite(id) || id <= 0) {
    const mintikaIds = resolveMintikaIds(current ?? {})
    return { mintikaId: mintikaIds[0] ?? current?.mintikaId ?? null, mintikaIds }
  }

  const profile = await usersApi.getById(id)
  const mintikaIds = resolveMintikaIds({
    mintikaIds: profile?.mintikaIds,
    mintikaId: profile?.mintikaId ?? current?.mintikaId,
    mintikalar: profile?.mintikalar,
  })
  return {
    mintikaId: mintikaIds[0] ?? profile?.mintikaId ?? current?.mintikaId ?? null,
    mintikaIds,
  }
}
