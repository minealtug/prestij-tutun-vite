import { cn } from '@/lib/utils/cn'
import type { SurveyResponseGroup } from '../types/survey-response.types'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import { resolveParentQuestionText } from '../utils/map-anket-cevap'

interface SurveyResponseAnswersPanelProps {
  row: SurveyResponseGroup
}

export function SurveyResponseAnswersPanel({ row }: SurveyResponseAnswersPanelProps) {
  const unansweredCount =
    row.yanitlanmayanSoruSayisi > 0
      ? row.yanitlanmayanSoruSayisi
      : row.answers.filter((item) => item.isUnanswered).length

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Sorular ve cevaplar ({row.answers.length} soru
        {unansweredCount > 0 ? `, ${unansweredCount} yanıtlanmadı` : ''})
      </p>
      <AnswersList answers={row.answers} groupId={row.id} />
    </div>
  )
}

function AnswersList({
  answers,
  groupId,
}: {
  answers: SurveyResponseGroup['answers']
  groupId: string
}) {
  if (answers.length === 0) {
    return <p className="text-sm text-muted">Gösterilecek soru yok.</p>
  }

  return (
    <ul className="space-y-3">
      {answers.map((answer) => {
        const parentText = resolveParentQuestionText(answer, answers)
        return (
          <li
            key={`${groupId}-${answer.soruId}-${answer.questionNo}`}
            className="border-b border-border/50 pb-3 last:border-0 last:pb-0"
          >
            <p className="text-xs font-medium text-primary-600">Soru {answer.questionNo}</p>
            <p className="mt-0.5 text-sm text-foreground">{answer.questionText}</p>
            {answer.altSoruMetni?.trim() && (
              <p className="mt-0.5 text-xs text-muted">{answer.altSoruMetni.trim()}</p>
            )}
            {answer.bagliSoru && (
              <p className="mt-1 text-xs text-muted">
                Bağlı soru
                {parentText ? (
                  <>
                    {' '}
                    · Bağlı olduğu: <span className="text-foreground">{parentText}</span>
                  </>
                ) : null}
              </p>
            )}
            <p
              className={cn(
                'mt-2 rounded-md px-3 py-2 text-sm',
                answer.isUnanswered
                  ? 'bg-amber-500/10 text-amber-900'
                  : 'bg-primary-500/5 text-foreground',
              )}
            >
              <span className="font-medium text-muted">Cevap: </span>
              {answer.isUnanswered ? UNANSWERED_ANSWER_LABEL : answer.answer}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
