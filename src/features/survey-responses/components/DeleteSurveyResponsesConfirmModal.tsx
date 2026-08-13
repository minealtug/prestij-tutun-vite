import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/api/api-error'
import type { AnketCevapOzetItem } from '../types/survey-response.types'
import { getOzetSurveyName } from '../types/survey-response.types'
import {
  formatEkiciNamePreview,
  getUniqueSelectedEkiciler,
} from '../utils/delete-survey-responses'

interface DeleteSurveyResponsesConfirmModalProps {
  open: boolean
  step: 1 | 2
  rows: AnketCevapOzetItem[]
  loading?: boolean
  error?: unknown
  onClose: () => void
  onConfirm: () => void
}

export function DeleteSurveyResponsesConfirmModal({
  open,
  step,
  rows,
  loading = false,
  error,
  onClose,
  onConfirm,
}: DeleteSurveyResponsesConfirmModalProps) {
  const ekiciler = getUniqueSelectedEkiciler(rows)
  const { visibleNames, remainingCount } = formatEkiciNamePreview(ekiciler.map((item) => item.fullName))
  const sablonAdlari = [
    ...new Set(
      rows
        .map((row) => getOzetSurveyName(row).trim())
        .filter((name) => name && name !== '-'),
    ),
  ]
  const errorMessage = error ? getErrorMessage(error) : ''
  const isSecondStep = step === 2
  const ekiciCountLabel =
    ekiciler.length === 1
      ? `${ekiciler[0]?.fullName ?? 'Seçilen ekici'} adlı ekicinin`
      : `${ekiciler.length} ekicinin`

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Silmek istiyor musunuz?"
      size="sm"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {isSecondStep ? 'Evet, sil' : 'Evet'}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-8 w-8 shrink-0 text-red-600" aria-hidden />
        <div className="space-y-3 text-sm text-foreground">
          <p className="font-medium">Silmek istiyor musunuz?</p>
          <p>
            <span className="font-semibold">{ekiciCountLabel}</span> anket cevapları
            {isSecondStep ? ' kalıcı olarak silinecek.' : ' silinecek.'}
          </p>
          {ekiciler.length > 1 && visibleNames.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {visibleNames.map((name, index) => (
                <li key={`${ekiciler[index]?.ekiciId ?? name}-${index}`}>{name}</li>
              ))}
            </ul>
          )}
          {remainingCount > 0 && (
            <p className="text-muted">ve {remainingCount} ekici daha</p>
          )}
          {sablonAdlari.length > 0 && (
            <p>
              <span className="font-medium">Şablon:</span> {sablonAdlari.join(', ')}
            </p>
          )}
          {isSecondStep && (
            <p className="font-medium text-red-700">Bu işlem geri alınamaz.</p>
          )}
          {errorMessage && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
