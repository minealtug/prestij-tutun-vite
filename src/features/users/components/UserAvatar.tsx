import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { resolveUserPhotoUrl } from '../utils/resolve-user-photo-url'

interface UserAvatarProps {
  fullName: string
  fotografUrl?: string | null
  userId?: string | number | null
  cacheKey?: string | number | null
  className?: string
  imageClassName?: string
  initialsClassName?: string
}

export function UserAvatar({
  fullName,
  fotografUrl,
  userId,
  cacheKey,
  className,
  imageClassName,
  initialsClassName,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const photoSrc = resolveUserPhotoUrl(fotografUrl, cacheKey, userId)

  useEffect(() => {
    setImageFailed(false)
  }, [fotografUrl, cacheKey, photoSrc, userId])

  const showPhoto = Boolean(photoSrc) && !imageFailed
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('')

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted/10',
        className,
      )}
    >
      {showPhoto ? (
        <img
          src={photoSrc!}
          alt=""
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span className={cn('text-xs font-semibold text-muted', initialsClassName)}>{initials}</span>
      ) : (
        <User className="h-4 w-4 text-muted" aria-hidden />
      )}
    </div>
  )
}
