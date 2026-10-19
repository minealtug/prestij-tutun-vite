import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { UnansweredOptionalQuestion } from '../utils/validate-survey-fill-answers'

interface SurveyFillOptionalConfirmModalProps {
  open: boolean
  questions: UnansweredOptionalQuestion[]
  saving?: boolean
  onClose: () => void
  onSaveAnyway: () => void
  onGoToQuestion: (key: string) => void
}

export function SurveyFillOptionalConfirmModal({
  open,
  questions,
  saving = false,
  onClose,
  onSaveAnyway,
  onGoToQuestion,
}: SurveyFillOptionalConfirmModalProps) {
  const firstQuestion = questions[0]
  const goToFirstQuestion = () => {
    if (!firstQuestion) return
    onGoToQuestion(firstQuestion.key)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Boş bırakılan sorular"
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={goToFirstQuestion} disabled={!firstQuestion || saving}>
            {questions.length > 1 ? 'İlk soruya git' : 'Soruya git'}
          </Button>
          <Button onClick={onSaveAnyway} loading={saving} disabled={!firstQuestion}>
            Yine de kaydet
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-foreground">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <p>
           {questions.length} Soru boş bırakıldı.
            Soruyu doldurmak için ilgili soruya gidebilir veya yine de kaydedebilirsiniz.
          </p>
        </div>
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {questions.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className="text-left font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800 disabled:opacity-60"
                onClick={() => onGoToQuestion(item.key)}
                disabled={saving}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
