import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { UnansweredOptionalQuestion } from '../utils/validate-survey-fill-answers'

interface SurveyFillSuccessModalProps {
  open: boolean
  onClose: () => void
  answeredCount?: number
  variant?: 'full' | 'draft'
  unansweredOptional?: UnansweredOptionalQuestion[]
}

export function SurveyFillSuccessModal({
  open,
  onClose,
  answeredCount,
  variant = 'full',
  unansweredOptional = [],
}: SurveyFillSuccessModalProps) {
  const navigate = useNavigate()
  const isDraft = variant === 'draft'
  const hasUnansweredOptional = unansweredOptional.length > 0

  const viewResponses = () => {
    onClose()
    navigate('/anket-cevaplari')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isDraft ? 'Taslak kaydedildi' : 'Cevaplarınız kaydedildi'}
      size={hasUnansweredOptional ? 'md' : 'sm'}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Tamam
          </Button>
          <Button onClick={viewResponses}>Cevapları görüntüle</Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3 text-sm text-foreground">
          <div className="space-y-1">
            <p>
              {isDraft
                ? 'Cevaplanan sorular taslak olarak kaydedildi. Kalan soruları daha sonra tamamlayabilirsiniz.'
                : 'Anket cevaplarınız başarıyla kaydedildi.'}
            </p>
            {answeredCount != null && answeredCount > 0 && (
              <p className="text-muted">{answeredCount} cevap güncellendi.</p>
            )}
          </div>

          {hasUnansweredOptional && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
              <p className="font-medium">
                {unansweredOptional.length} Soru boş bırakıldı
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                 Boş kalan sorular:
              </p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {unansweredOptional.map((item) => (
                  <li key={item.key} className="text-sm">
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
