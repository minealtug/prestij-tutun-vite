import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/api/api-error'
import { useDeleteUserPhoto, useUploadUserPhoto } from '../hooks/use-users'
import { UserAvatar } from './UserAvatar'

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

interface UserPhotoFieldProps {
  userId: number
  fullName: string
  fotografUrl: string | null
  disabled?: boolean
}

export function UserPhotoField({
  userId,
  fullName,
  fotografUrl,
  disabled = false,
}: UserPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadPhoto = useUploadUserPhoto()
  const deletePhoto = useDeleteUserPhoto()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [cacheKey, setCacheKey] = useState(() => Date.now())

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const isBusy = uploadPhoto.isPending || deletePhoto.isPending
  const currentPhotoUrl = previewUrl ?? fotografUrl

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Yalnızca görsel dosyası yükleyebilirsiniz.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Fotoğraf en fazla 5 MB olabilir.')
      return
    }

    setError('')
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl((previous) => {
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
      return objectUrl
    })

    uploadPhoto.mutate(
      { id: userId, file },
      {
        onSuccess: (user) => {
          setPreviewUrl(null)
          setCacheKey(Date.now())
          if (!user.fotografUrl) {
            setError('Fotoğraf yüklendi ancak adres alınamadı.')
          }
        },
        onError: (uploadError) => {
          setPreviewUrl(null)
          setError(getErrorMessage(uploadError))
        },
      },
    )
  }

  const handleDelete = () => {
    setError('')
    deletePhoto.mutate(userId, {
      onSuccess: () => {
        setPreviewUrl(null)
        setCacheKey(Date.now())
      },
      onError: (deleteError) => setError(getErrorMessage(deleteError)),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          fullName={fullName}
          fotografUrl={currentPhotoUrl}
          userId={userId}
          cacheKey={cacheKey}
          className="h-20 w-20"
          imageClassName="h-20 w-20"
        />

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isBusy}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {fotografUrl || previewUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
          </Button>
          {(fotografUrl || previewUrl) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isBusy}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Kaldır
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">JPG, PNG, WEBP veya GIF. Maksimum 5 MB.</p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
