import { useState, type FormEvent } from 'react'
import { Link2, Save, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/api/api-error'
import { ANSWER_TYPE_OPTIONS, CATEGORY_OPTIONS, CHOICE_ANSWER_TYPES } from '../constants'
import { useCreateQuestion } from '../hooks/use-questions'
import type { AnswerType, VisibilityRule } from '../types/question.types'

const defaultForm = {
  surveyName: '',
  category: 'Genel',
  order: 1,
  answerType: 'long_text' as AnswerType,
  options: '',
  questionText: '',
  isActive: true,
}

export function QuestionForm() {
  const createQuestion = useCreateQuestion()
  const [form, setForm] = useState(defaultForm)
  const [visibilityRules, setVisibilityRules] = useState<VisibilityRule[]>([])

  const showOptions = CHOICE_ANSWER_TYPES.includes(form.answerType)

  const resetForm = () => {
    setForm(defaultForm)
    setVisibilityRules([])
  }

  const submit = (saveAsDraft: boolean) => (e: FormEvent) => {
    e.preventDefault()
    createQuestion.mutate(
      {
        ...form,
        visibilityRules,
        saveAsDraft,
      },
      {
        onSuccess: () => resetForm(),
      },
    )
  }

  const addVisibilityRule = () => {
    setVisibilityRules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), condition: '', value: '' },
    ])
  }

  return (
    <Card className="border-primary-500/20">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">Yeni Soru Ekle</h3>
      </div>

      <form className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Anket İsmi"
            value={form.surveyName}
            onChange={(e) => setForm((f) => ({ ...f, surveyName: e.target.value }))}
            placeholder="Anket adını girin"
            required
          />
          <Select
            label="Kategori"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={CATEGORY_OPTIONS}
          />
          <Input
            label="Sıra"
            type="number"
            min={1}
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 1 }))}
            required
          />
          <Select
            label="Cevap Tipi"
            value={form.answerType}
            onChange={(e) =>
              setForm((f) => ({ ...f, answerType: e.target.value as AnswerType }))
            }
            options={ANSWER_TYPE_OPTIONS}
          />
        </div>

        {showOptions && (
          <Input
            label="Seçenekler (çoktan seçmeli için)"
            value={form.options}
            onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
            placeholder="Örn: Evet, Hayır"
            hint="Seçenekleri virgülle ayırın"
          />
        )}

        <Textarea
          label="Soru"
          value={form.questionText}
          onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
          placeholder="Soru metnini yazın"
          required
        />

        <div className="rounded-lg border border-dashed border-border bg-surface/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Görünürlük Kuralları (Opsiyonel)
              </p>
              <p className="mt-1 text-xs text-muted">
                Kural yoksa soru her zaman görünür.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addVisibilityRule}>
              <Link2 className="h-4 w-4" />
              Bağlı Soru Ekle
            </Button>
          </div>

          {visibilityRules.length > 0 && (
            <ul className="mt-4 space-y-3">
              {visibilityRules.map((rule, index) => (
                <li
                  key={rule.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface-elevated p-3 md:grid-cols-3"
                >
                  <Input
                    label={`Bağlı soru #${index + 1}`}
                    placeholder="Soru no veya ID"
                    value={rule.linkedQuestionId ?? ''}
                    onChange={(e) =>
                      setVisibilityRules((rules) =>
                        rules.map((r) =>
                          r.id === rule.id ? { ...r, linkedQuestionId: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Input
                    label="Koşul"
                    placeholder="Örn: eşittir"
                    value={rule.condition ?? ''}
                    onChange={(e) =>
                      setVisibilityRules((rules) =>
                        rules.map((r) =>
                          r.id === rule.id ? { ...r, condition: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Input
                    label="Değer"
                    placeholder="Örn: Evet"
                    value={rule.value ?? ''}
                    onChange={(e) =>
                      setVisibilityRules((rules) =>
                        rules.map((r) =>
                          r.id === rule.id ? { ...r, value: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-foreground">Aktif (müşteri formunda görünsün)</span>
        </label>

        {createQuestion.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {getErrorMessage(createQuestion.error)}
          </p>
        )}

        {createQuestion.isSuccess && (
          <p className="text-sm text-primary-600">Soru kaydedildi.</p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            loading={createQuestion.isPending}
            onClick={submit(true)}
          >
            <FilePlus className="h-4 w-4" />
            Taslağa Ekle
          </Button>
          <Button type="button" loading={createQuestion.isPending} onClick={submit(false)}>
            <Save className="h-4 w-4" />
            Hemen Kaydet
          </Button>
        </div>
      </form>
    </Card>
  )
}
