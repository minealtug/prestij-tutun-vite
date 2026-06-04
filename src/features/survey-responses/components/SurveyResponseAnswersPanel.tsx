import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/feedback/Skeleton'
import { useQuestions } from '@/features/questions/hooks/use-questions'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useUnansweredQuestions } from '../hooks/use-unanswered-questions'
import type { SurveyResponseGroup } from '../types/survey-response.types'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import { mergeSurveyAnswers, mergeWithSurveyTemplate } from '../utils/merge-survey-answers'
import { resolveBaslikId } from '../utils/resolve-baslik-id'

interface SurveyResponseAnswersPanelProps {
  row: SurveyResponseGroup
}

export function SurveyResponseAnswersPanel({ row }: SurveyResponseAnswersPanelProps) {
  const surveysQuery = useSurveys()
  const baslikId = useMemo(
    () => resolveBaslikId(row, surveysQuery.data ?? []),
    [row, surveysQuery.data],
  )

  const unansweredQuery = useUnansweredQuestions(row.ekiciId, baslikId, baslikId > 0)
  const questionsQuery = useQuestions(baslikId > 0 ? baslikId : undefined)

  const mergedAnswers = useMemo(() => {
    const unanswered = unansweredQuery.data?.yanitlanmayanSorular ?? []
    const withUnanswered = mergeSurveyAnswers(row.answers, unanswered)
    if (!questionsQuery.data?.length) return withUnanswered
    return mergeWithSurveyTemplate(withUnanswered, questionsQuery.data)
  }, [row.answers, unansweredQuery.data, questionsQuery.data])

  const unansweredCount = mergedAnswers.filter((item) => item.isUnanswered).length
  const isLoading =
    unansweredQuery.isLoading || questionsQuery.isLoading || surveysQuery.isLoading

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const loadError = unansweredQuery.isError && questionsQuery.isError

  if (loadError) {
    return (
      <div>
        <p className="mb-3 text-xs text-amber-700">
          Yanıtlanmayan sorular yüklenemedi; yalnızca cevaplanmış sorular gösteriliyor.
        </p>
        <AnswersList answers={row.answers} groupId={row.id} />
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Sorular ve cevaplar ({mergedAnswers.length} soru
        {unansweredCount > 0 ? `, ${unansweredCount} yanıtlanmadı` : ''})
      </p>
      {unansweredQuery.isError && (
        <p className="mb-3 text-xs text-amber-700">
          Yanıtlanmayan sorular API&apos;den alınamadı; eksik sorular anket tanımından
          tamamlandı.
        </p>
      )}
      <AnswersList answers={mergedAnswers} groupId={row.id} />
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
      {answers.map((answer) => (
        <li
          key={`${groupId}-${answer.questionNo}`}
          className="border-b border-border/50 pb-3 last:border-0 last:pb-0"
        >
          <p className="text-xs font-medium text-primary-600">Soru {answer.questionNo}</p>
          <p className="mt-0.5 text-sm text-foreground">{answer.questionText}</p>
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
      ))}
    </ul>
  )
}
