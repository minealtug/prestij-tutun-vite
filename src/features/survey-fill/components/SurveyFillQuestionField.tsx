import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from '../utils/build-answer-type-kind-lookup'
import { getFriendlyAnswerTypeLabel } from '@/features/questions/utils/answer-type-label'
import { getQuestionKey } from '../utils/question-key'
import { getSurveyFillQuestionLabel } from '../utils/is-ekici-producer-question'
import { resolveQuestionInputKind } from '../utils/resolve-question-input-kind'

interface SurveyFillQuestionFieldProps {
  question: SurveyFillSoruView
  /** Verilmezse soru numarası gösterilmez (üretimi yapan kişi sorusu). */
  displayNumber?: number
  value: string
  error?: string
  onChange: (value: string) => void
  ekiciOptions?: SearchableSelectOption[]
  ekiciLoading?: boolean
  selectLoading?: boolean
  answerTypeLookup?: AnswerTypeKindLookup
}

export function SurveyFillQuestionField({
  question,
  displayNumber,
  value,
  error,
  onChange,
  ekiciOptions = [],
  ekiciLoading = false,
  selectLoading = false,
  answerTypeLookup,
}: SurveyFillQuestionFieldProps) {
  const fieldId = `survey-fill-${getQuestionKey(question)}`
  const kind = resolveQuestionInputKind(question, answerTypeLookup)
  const questionLabel = getSurveyFillQuestionLabel(question)
  const answerHint = question.cevapGirdiTipAdi
    ? getFriendlyAnswerTypeLabel(question.cevapGirdiTipAdi)
    : undefined
  const selectOptions = (question.altSecenekler ?? []).map((option) => ({
    value: String(option.id),
    label: option.adi,
  }))

  return (
    <article
      className={cn(
        'rounded-xl border border-border/80 bg-surface-elevated/60 p-4 sm:p-5',
        question.bagliSoru && 'ml-3 border-l-4 border-l-primary-300/70 sm:ml-4',
        error && 'border-red-300/80 ring-1 ring-red-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {displayNumber != null && (
            <p className="text-xs font-medium text-primary-600">Soru {displayNumber}</p>
          )}
          <p className="text-sm font-medium leading-snug text-foreground sm:text-base">
            {questionLabel}
          </p>
          {kind !== 'ekici' && question.altSoruMetni?.trim() && (
            <p className="text-xs leading-snug text-muted sm:text-sm">{question.altSoruMetni}</p>
          )}
          {question.bagliSoru && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Bağlı soru
            </p>
          )}
        </div>
        {question.zorunlu && (
          <span className="shrink-0 whitespace-nowrap text-xs font-medium text-red-600">
            <span
              className="mr-1 text-lg font-semibold leading-none text-red-500"
              title="Zorunlu soru"
              aria-label="Zorunlu soru"
            >
              *
            </span>
            Zorunlu soru
          </span>
        )}
      </div>

      <div className="mt-4">
        {kind === 'ekici' ? (
          <SearchableSelect
            value={value}
            onChange={onChange}
            options={ekiciOptions}
            disabled={ekiciLoading}
            error={error}
            placeholder={ekiciLoading ? 'Ekiciler yükleniyor...' : 'Ad veya soyad ile ekici ara...'}
            emptyMessage="Eşleşen ekici bulunamadı"
          />
        ) : kind === 'select' ? (
          <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            options={[
              {
                value: '',
                label: selectLoading
                  ? 'Seçenekler yükleniyor...'
                  : selectOptions.length > 0
                    ? 'Seçenek seçin'
                    : 'Seçenek bulunamadı',
              },
              ...selectOptions,
            ]}
            disabled={selectLoading || selectOptions.length === 0}
            error={error}
          />
        ) : kind === 'textarea' ? (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Cevabınızı yazın"
            error={error}
            rows={4}
          />
        ) : kind === 'checkbox' ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-surface px-3 py-3">
            <input
              id={fieldId}
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-foreground">Evet</span>
          </label>
        ) : (
          <Input
            id={fieldId}
            type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : kind === 'datetime' ? 'datetime-local' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Cevabınızı girin"
            error={error}
          />
        )}

        {kind === 'checkbox' && error && (
          <p className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        {answerHint && kind !== 'checkbox' && kind !== 'ekici' && kind !== 'select' && (
          <p className="mt-1.5 text-xs text-muted">{answerHint}</p>
        )}
      </div>
    </article>
  )
}
