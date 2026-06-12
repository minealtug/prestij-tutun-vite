import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface SurveyFillSuccessModalProps {
  open: boolean
  onClose: () => void
  baslikId: number
  answeredCount?: number
}

export function SurveyFillSuccessModal({
  open,
  onClose,
  baslikId,
  answeredCount,
}: SurveyFillSuccessModalProps) {
  const navigate = useNavigate()

  const viewResponses = () => {
    onClose()
    navigate(`/anket-cevaplari?baslikId=${baslikId}&auto=1`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cevaplarınız kaydedildi"
      size="sm"
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
        <div className="space-y-1 text-sm text-foreground">
          <p>Anket cevaplarınız başarıyla kaydedildi.</p>
          {answeredCount != null && answeredCount > 0 && (
            <p className="text-muted">{answeredCount} cevap güncellendi.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
