import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface SurveyFillSaveSuccessModalProps {
  open: boolean
  onClose: () => void
  savedAnswerCount: number
}

export function SurveyFillSaveSuccessModal({
  open,
  onClose,
  savedAnswerCount,
}: SurveyFillSaveSuccessModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cevaplarınız kaydedildi"
      size="sm"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>Tamam</Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-10 w-10 shrink-0 text-emerald-500" aria-hidden />
        <div className="space-y-1 text-sm text-foreground">
          <p>
            {savedAnswerCount > 0
              ? `${savedAnswerCount} cevap başarıyla kaydedildi.`
              : 'Cevaplarınız başarıyla kaydedildi.'}
          </p>
          <p className="text-muted">
            Kayıt özeti sol menüdeki &quot;Son kaydedilenler&quot; bölümünden tekrar açılabilir.
          </p>
        </div>
      </div>
    </Modal>
  )
}
