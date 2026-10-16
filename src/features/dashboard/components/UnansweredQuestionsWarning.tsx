import type { StalePartialUnansweredInfo } from '../hooks/use-stale-partial-unanswered'

const PREVIEW_QUESTION_COUNT = 2

interface UnansweredQuestionsWarningProps {
  info: StalePartialUnansweredInfo | undefined
  unansweredCount: number
}

export function UnansweredQuestionsWarning({
  info,
  unansweredCount,
}: UnansweredQuestionsWarningProps) {
  if (info?.loading) {
    return <span className="text-xs text-muted">Eksik sorular yükleniyor…</span>
  }

  const questions = info?.questions ?? []
  if (questions.length === 0) {
    const count = Math.max(0, unansweredCount)
    if (count <= 0) {
      return <span className="text-xs text-muted">Eksik soru bilgisi yok</span>
    }
    return (
      <p className="text-xs text-orange-900">
        {count.toLocaleString('tr-TR')} soru boş kaldığı için form yarım.
      </p>
    )
  }

  const preview = questions.slice(0, PREVIEW_QUESTION_COUNT)
  const remaining = questions.length - preview.length
  const fullList = questions.join('\n')

  return (
    <div className="max-w-sm" title={fullList}>
      <p className="mb-1 text-[11px] font-medium text-orange-800">
        {questions.length.toLocaleString('tr-TR')} soru boş kaldığı için yarım
      </p>
      <ul className="space-y-0.5">
        {preview.map((question) => (
          <li key={question} className="truncate text-xs text-orange-950">
            {question}
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <p className="mt-0.5 text-[11px] text-orange-800">
          +{remaining.toLocaleString('tr-TR')} soru daha
        </p>
      ) : null}
    </div>
  )
}
