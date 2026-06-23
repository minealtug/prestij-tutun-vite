import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
import {
  parseMultiSelectValue,
  toggleMultiSelectValue,
} from '../utils/multi-select-value'
import {
  hasSecenekGrupDropdown,
  resolveEffectiveQuestionInputKind,
  type QuestionInputKind,
} from '../utils/resolve-question-input-kind'

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
  disabled?: boolean
  useManualEntry?: boolean
  onEnableManualEntry?: () => void
  onDisableManualEntry?: () => void
}

function renderAnswerControl(
  kind: QuestionInputKind,
  props: {
    fieldId: string
    value: string
    error?: string
    disabled: boolean
    onChange: (value: string) => void
    ekiciOptions: SearchableSelectOption[]
    ekiciLoading: boolean
    label?: string
    selectOptions?: { value: string; label: string }[]
  },
) {
  const {
    fieldId,
    value,
    error,
    disabled,
    onChange,
    ekiciOptions,
    ekiciLoading,
    label,
    selectOptions = [],
  } = props

  if (kind === 'ekici') {
    return (
      <SearchableSelect
        label={label}
        value={value}
        onChange={onChange}
        options={ekiciOptions}
        disabled={disabled || ekiciLoading}
        error={error}
        placeholder={ekiciLoading ? 'Ekiciler yükleniyor...' : 'Ad veya soyad ile ekici ara...'}
        emptyMessage="Eşleşen ekici bulunamadı"
      />
    )
  }

  if (kind === 'textarea') {
    return (
      <Textarea
        id={fieldId}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cevabınızı yazın"
        error={error}
        rows={4}
        disabled={disabled}
      />
    )
  }

  if (kind === 'checkbox') {
    return (
      <>
        {label ? <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p> : null}
        <label
          className={cn(
            'flex items-start gap-3 rounded-lg border border-border/70 bg-surface px-3 py-3',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <input
            id={fieldId}
            type="checkbox"
            checked={value === 'true'}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-foreground">Evet</span>
        </label>
      </>
    )
  }

  if (kind === 'multiSelect') {
    const selectedIds = new Set(parseMultiSelectValue(value))

    return (
      <>
        {label ? <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p> : null}
        <div className="space-y-2 rounded-lg border border-border/70 bg-surface p-3">
          {selectOptions.length === 0 ? (
            <p className="text-sm text-muted">Seçenek bulunamadı</p>
          ) : (
            selectOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 rounded-md px-1 py-1.5',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              )}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(Number(option.value))}
                disabled={disabled}
                onChange={(e) =>
                  onChange(
                    toggleMultiSelectValue(value, Number(option.value), e.target.checked),
                  )
                }
                className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
            ))
          )}
        </div>
      </>
    )
  }

  return (
    <Input
      id={fieldId}
      label={label}
      type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Cevabınızı girin"
      error={error}
      disabled={disabled}
    />
  )
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
  disabled = false,
  useManualEntry = false,
  onEnableManualEntry,
  onDisableManualEntry,
}: SurveyFillQuestionFieldProps) {
  const fieldId = `survey-fill-${getQuestionKey(question)}`
  const kind = resolveEffectiveQuestionInputKind(question, answerTypeLookup, useManualEntry)
  const showSecenekDropdown =
    kind === 'select' && hasSecenekGrupDropdown(question) && !useManualEntry
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
        disabled && 'opacity-70',
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
            <span className="underline">Zorunlu soru</span>
          </span>
        )}
      </div>

      <div className="mt-4">
        {showSecenekDropdown ? (
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Select
                  label="Cevap"
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
                  disabled={disabled || selectLoading || selectOptions.length === 0}
                  error={error}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="h-10 w-10 shrink-0 px-0"
                onClick={onEnableManualEntry}
                disabled={disabled}
                title="Listede yoksa manuel giriş yap"
                aria-label="Manuel cevap gir"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted">
              Listede cevabınız yoksa + ile manuel giriş yapabilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {useManualEntry && onDisableManualEntry ? (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  onClick={onDisableManualEntry}
                  disabled={disabled}
                >
                  Listeden seç
                </button>
              </div>
            ) : null}
            {renderAnswerControl(kind, {
              fieldId,
              value,
              error,
              disabled: disabled || (kind === 'multiSelect' && selectLoading),
              onChange,
              ekiciOptions,
              ekiciLoading,
              label: kind === 'ekici' ? undefined : 'Cevap',
              selectOptions,
            })}
          </>
        )}

        {(kind === 'checkbox' || kind === 'multiSelect') && error && (
          <p className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        {answerHint &&
          kind !== 'checkbox' &&
          kind !== 'multiSelect' &&
          kind !== 'ekici' &&
          !showSecenekDropdown && (
            <p className="mt-1.5 text-xs text-muted">{answerHint}</p>
          )}
      </div>
    </article>
  )
}
