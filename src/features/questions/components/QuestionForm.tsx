import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/api/api-error'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useAnswerUnits } from '@/features/answer-units/hooks/use-answer-units'
import { useSecenekGruplari } from '../hooks/use-secenek-gruplari'
import {
  useAnswerInputTypes,
  useCreateLinkedQuestionWithMigrate,
  useCreateNewLinkedQuestion,
  useCreateQuestion,
  useLinkExistingQuestion,
  useQuestions,
} from '../hooks/use-questions'
import type {
  CreateQuestionRequest,
  LinkedQuestionMigrateResultDto,
  QuestionConnectionDto,
} from '../types/question.types'
import { getFriendlyAnswerTypeLabel } from '../utils/answer-type-label'
import { needsSecenekGrup } from '../utils/needs-secenek-grup'
import { mapLinkedChildren } from '../utils/map-linked-children'
import { BAGLI_KOSUL_ESIT, BAGLI_KOSUL_TIPI_OPTIONS, normalizeBagliKosulTipi } from '../utils/bagli-kosul-tipi'
import {
  GORUNME_KOSULU_LABEL,
  SECENEK_GRUP_LABEL,
  SECENEK_GRUP_LINKED_LABEL,
  SECENEK_GRUP_LOADING,
  SECENEK_GRUP_PLACEHOLDER,
  getBagliSoruTriggerLabel,
  getBagliSoruVisibilityHint,
} from '../utils/question-field-labels'
import { clearLinkedChildTriggers } from '../utils/clear-linked-child-triggers'
import { AltSecenekSelect } from './AltSecenekSelect'
import {
  LinkedChildEditor,
  type LinkedChildDraft,
} from './LinkedChildEditor'

type LinkedMode = 'yeni' | 'mevcut'

const defaultForm = {
  baslikId: '',
  cevapGirdiTipId: '',
  secenekGrupId: '',
  anketCevapBirimId: '',
  soruMetni: '',
  zorunlu: true,
  aktif: true,
  bagliSoru: false,
}

interface QuestionFormProps {
  readOnly?: boolean
}

export function QuestionForm({ readOnly = false }: QuestionFormProps) {
  const createQuestion = useCreateQuestion()
  const createNewLinkedQuestion = useCreateNewLinkedQuestion()
  const linkExistingQuestion = useLinkExistingQuestion()
  const createLinkedQuestionWithMigrate = useCreateLinkedQuestionWithMigrate()
  const surveysQuery = useSurveys()
  const answerInputTypesQuery = useAnswerInputTypes()
  const answerUnitsQuery = useAnswerUnits()
  const secenekGruplariQuery = useSecenekGruplari()
  const [form, setForm] = useState(defaultForm)
  const [linkedMode, setLinkedMode] = useState<LinkedMode>('yeni')
  const [parentQuestionId, setParentQuestionId] = useState('')
  const [existingLinkedQuestionId, setExistingLinkedQuestionId] = useState('')
  const [bagliAltSecenekId, setBagliAltSecenekId] = useState('')
  const [bagliKosulTipi, setBagliKosulTipi] = useState(BAGLI_KOSUL_ESIT)
  const [linkedChildren, setLinkedChildren] = useState<LinkedChildDraft[]>([])
  const [formError, setFormError] = useState('')
  const [linkedMigrateResult, setLinkedMigrateResult] = useState<LinkedQuestionMigrateResultDto | null>(null)
  const [linkedConnectionResult, setLinkedConnectionResult] = useState<QuestionConnectionDto | null>(null)
  const selectedBaslikId = Number(form.baslikId)
  const questionsBySurveyQuery = useQuestions(selectedBaslikId > 0 ? selectedBaslikId : undefined)

  const surveyOptions = useMemo(
    () =>
      (surveysQuery.data ?? []).map((survey) => ({
        key: `${survey.kaynak ?? 'unknown'}-${survey.id}`,
        value: String(survey.id),
        label: survey.name,
      })),
    [surveysQuery.data],
  )

  const cevapTipiOptions = useMemo(() => {
    const options = (answerInputTypesQuery.data ?? [])
      .sort((a, b) => a.siraNo - b.siraNo)
      .map((item) => {
        const friendly = getFriendlyAnswerTypeLabel(item.adi)
        return {
          value: String(item.id),
          label: friendly === item.adi ? friendly : `${friendly} (${item.adi})`,
        }
      })

    return [{ value: '', label: 'Cevap tipi seçin' }, ...options]
  }, [answerInputTypesQuery.data])

  const birimOptions = useMemo(
    () => [
      {
        value: '',
        label: answerUnitsQuery.isLoading ? 'Birimler yükleniyor...' : 'Birim seçin',
      },
      ...(answerUnitsQuery.data ?? []).map((unit) => ({
        value: String(unit.id),
        label: unit.adi,
      })),
    ],
    [answerUnitsQuery.data, answerUnitsQuery.isLoading],
  )

  const selectedAnswerType = useMemo(
    () =>
      (answerInputTypesQuery.data ?? []).find((item) => String(item.id) === form.cevapGirdiTipId),
    [answerInputTypesQuery.data, form.cevapGirdiTipId],
  )

  const showSecenekGrup = selectedAnswerType ? needsSecenekGrup(selectedAnswerType.adi) : false

  const secenekGrupOptions = useMemo(
    () => [
      {
        value: '',
        label: secenekGruplariQuery.isLoading ? SECENEK_GRUP_LOADING : SECENEK_GRUP_PLACEHOLDER,
      },
      ...secenekGruplariQuery.secenekGruplari.map((grup) => ({
        value: String(grup.id),
        label: grup.label,
      })),
    ],
    [secenekGruplariQuery.isLoading, secenekGruplariQuery.secenekGruplari],
  )

  const selectedSecenekGrupId = Number(form.secenekGrupId)

  const getSecenekGrupLabel = (secenekGrupId?: number) =>
    secenekGrupOptions.find((option) => Number(option.value) === secenekGrupId)?.label

  const selectedParentQuestion = useMemo(
    () =>
      (questionsBySurveyQuery.data ?? []).find((question) => String(question.id) === parentQuestionId),
    [parentQuestionId, questionsBySurveyQuery.data],
  )

  const parentSecenekGrupId = selectedParentQuestion?.secenekGrupId ?? undefined

  const questionOptions = useMemo(
    () =>
      (questionsBySurveyQuery.data ?? []).map((question) => ({
        value: String(question.id),
        label: `[${question.kaynak ?? 'Bilinmiyor'}] #${question.id} - ${question.soruMetni}`,
      })),
    [questionsBySurveyQuery.data],
  )

  const parentQuestionOptions = useMemo(
    () => [{ value: '', label: 'Bağlı olunacak soru seçin' }, ...questionOptions],
    [questionOptions],
  )

  const existingQuestionOptions = useMemo(() => {
    const filtered = questionOptions.filter((option) => option.value !== parentQuestionId)
    return [{ value: '', label: 'Bağlanacak mevcut soru seçin' }, ...filtered]
  }, [parentQuestionId, questionOptions])

  const isSubmitting =
    createQuestion.isPending ||
    createNewLinkedQuestion.isPending ||
    linkExistingQuestion.isPending ||
    createLinkedQuestionWithMigrate.isPending

  const resetForm = () => {
    setForm(defaultForm)
    setLinkedMode('yeni')
    setParentQuestionId('')
    setExistingLinkedQuestionId('')
    setBagliAltSecenekId('')
    setBagliKosulTipi(BAGLI_KOSUL_ESIT)
    setLinkedChildren([])
    setFormError('')
  }

  const buildQuestionFields = (
    baslikId: number,
    cevapGirdiTipId: number,
    soruMetni: string,
    zorunlu: boolean,
    aktif: boolean,
    anketCevapBirimId?: number,
    secenekGrupId?: number,
  ): Omit<CreateQuestionRequest, 'bagliSoru' | 'bagliSorular'> => ({
    baslikId,
    cevapGirdiTipId,
    soruMetni,
    zorunlu,
    aktif,
    ...(anketCevapBirimId != null && anketCevapBirimId > 0 ? { anketCevapBirimId } : {}),
    ...(secenekGrupId != null && secenekGrupId > 0 ? { secenekGrupId } : {}),
  })

  const mapLinkedChildrenFromDrafts = (
    children: LinkedChildDraft[],
    parentSecenekGrupId?: number,
  ) =>
    mapLinkedChildren(
      children,
      parentSecenekGrupId,
      answerInputTypesQuery.data ?? [],
      setFormError,
    )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (readOnly) return
    setFormError('')
    setLinkedMigrateResult(null)
    setLinkedConnectionResult(null)

    const baslikId = Number(form.baslikId)
    if (!Number.isFinite(baslikId) || baslikId <= 0) {
      setFormError('Lütfen geçerli bir anket başlığı seçin.')
      return
    }

    const parsedParentQuestionId = Number(parentQuestionId)
    if (form.bagliSoru && (!Number.isFinite(parsedParentQuestionId) || parsedParentQuestionId <= 0)) {
      setFormError('Bağlı soru için parent soru seçmelisiniz.')
      return
    }

    if (form.bagliSoru && linkedMode === 'mevcut') {
      const parsedExistingQuestionId = Number(existingLinkedQuestionId)
      if (!Number.isFinite(parsedExistingQuestionId) || parsedExistingQuestionId <= 0) {
        setFormError('Bağlanacak mevcut soru seçmelisiniz.')
        return
      }

      const parsedBagliAltSecenekId = Number(bagliAltSecenekId)
      const bagliAltSecenekIdValue =
        Number.isFinite(parsedBagliAltSecenekId) && parsedBagliAltSecenekId > 0
          ? parsedBagliAltSecenekId
          : undefined

      linkExistingQuestion.mutate(
        {
          parentId: parsedParentQuestionId,
          payload: {
            bagliSoruId: parsedExistingQuestionId,
            ...(bagliAltSecenekIdValue ? { bagliAltSecenekId: bagliAltSecenekIdValue } : {}),
            bagliKosulTipi: normalizeBagliKosulTipi(bagliKosulTipi),
          },
        },
        {
          onSuccess: (result) => {
            setLinkedConnectionResult(result)
            resetForm()
          },
        },
      )
      return
    }

    const cevapGirdiTipId = Number(form.cevapGirdiTipId)
    if (!Number.isFinite(cevapGirdiTipId) || cevapGirdiTipId <= 0) {
      setFormError('Lütfen geçerli bir cevap tipi seçin.')
      return
    }
    if (!form.soruMetni.trim()) {
      setFormError('Soru metni boş olamaz.')
      return
    }

    const parsedAnketCevapBirimId = Number(form.anketCevapBirimId)
    const anketCevapBirimId =
      Number.isFinite(parsedAnketCevapBirimId) && parsedAnketCevapBirimId > 0
        ? parsedAnketCevapBirimId
        : undefined

    const parsedSecenekGrupId = Number(form.secenekGrupId)
    const secenekGrupId =
      Number.isFinite(parsedSecenekGrupId) && parsedSecenekGrupId > 0 ? parsedSecenekGrupId : undefined

    if (showSecenekGrup && !secenekGrupId) {
      setFormError('Seçenekli cevap tipleri için seçenek grubu seçmelisiniz.')
      return
    }

    const questionFields = buildQuestionFields(
      baslikId,
      cevapGirdiTipId,
      form.soruMetni.trim(),
      form.zorunlu,
      form.aktif,
      anketCevapBirimId,
      secenekGrupId,
    )

    const parsedBagliAltSecenekId = Number(bagliAltSecenekId)
    const bagliAltSecenekIdValue =
      Number.isFinite(parsedBagliAltSecenekId) && parsedBagliAltSecenekId > 0
        ? parsedBagliAltSecenekId
        : undefined

    if (form.bagliSoru) {
      if (selectedParentQuestion?.kaynak === 'LegacyDb') {
        const bagliSorular =
          linkedChildren.length > 0
            ? mapLinkedChildrenFromDrafts(linkedChildren, parentSecenekGrupId ?? undefined)
            : undefined
        if (linkedChildren.length > 0 && !bagliSorular) return

        createLinkedQuestionWithMigrate.mutate(
          {
            ...questionFields,
            parentLegacyQuestionId: parsedParentQuestionId,
            ...(bagliAltSecenekIdValue ? { bagliLegacyAltSecenekId: bagliAltSecenekIdValue } : {}),
            bagliKosulTipi: normalizeBagliKosulTipi(bagliKosulTipi),
          },
          {
            onSuccess: (result) => {
              setLinkedMigrateResult(result)
              resetForm()
            },
          },
        )
        return
      }

      const bagliSorular =
        linkedChildren.length > 0
          ? mapLinkedChildrenFromDrafts(
              linkedChildren,
              Number.isFinite(selectedSecenekGrupId) && selectedSecenekGrupId > 0
                ? selectedSecenekGrupId
                : undefined,
            )
          : undefined
      if (linkedChildren.length > 0 && !bagliSorular) return

      createNewLinkedQuestion.mutate(
        {
          parentId: parsedParentQuestionId,
          payload: {
            ...questionFields,
            ...(bagliAltSecenekIdValue ? { bagliAltSecenekId: bagliAltSecenekIdValue } : {}),
            bagliKosulTipi: normalizeBagliKosulTipi(bagliKosulTipi),
            ...(bagliSorular ? { bagliSorular } : {}),
          },
        },
        {
          onSuccess: () => resetForm(),
        },
      )
      return
    }

    const bagliSorular =
      linkedChildren.length > 0 ? mapLinkedChildrenFromDrafts(linkedChildren, secenekGrupId) : undefined
    if (linkedChildren.length > 0 && !bagliSorular) return

    const payload: CreateQuestionRequest = {
      ...questionFields,
      bagliSoru: false,
      ...(bagliSorular ? { bagliSorular } : {}),
    }

    createQuestion.mutate(payload, {
      onSuccess: () => resetForm(),
    })
  }

  const submitError =
    createQuestion.error ??
    createNewLinkedQuestion.error ??
    linkExistingQuestion.error ??
    createLinkedQuestionWithMigrate.error

  const showMainQuestionFields = !form.bagliSoru
  const showLinkedChildrenSection =
    !form.bagliSoru || (form.bagliSoru && linkedMode === 'yeni')

  const renderQuestionFields = (
    idPrefix = '',
    trigger?: {
      secenekGrupId?: number
      value: string
      onChange: (value: string) => void
    },
  ): ReactNode => (
    <div className="space-y-4">
      {trigger ? (
        <div className="space-y-2">
          <AltSecenekSelect
            key={`trigger-${idPrefix}-${trigger.secenekGrupId ?? 'none'}`}
            id={`${idPrefix}trigger`}
            secenekGrupId={trigger.secenekGrupId}
            label={getBagliSoruTriggerLabel(
              trigger.secenekGrupId
                ? getSecenekGrupLabel(trigger.secenekGrupId) ?? undefined
                : undefined,
            )}
            value={trigger.value}
            onChange={trigger.onChange}
            disabled={secenekGruplariQuery.isLoading || !trigger.secenekGrupId}
            required={Boolean(trigger.secenekGrupId)}
          />
          {trigger.secenekGrupId ? (
            <>
              <Select
                label={GORUNME_KOSULU_LABEL}
                value={bagliKosulTipi}
                onChange={(e) => setBagliKosulTipi(e.target.value)}
                options={BAGLI_KOSUL_TIPI_OPTIONS}
              />
              <p className="text-xs text-muted">
                {getBagliSoruVisibilityHint(
                  getSecenekGrupLabel(trigger.secenekGrupId),
                  bagliKosulTipi,
                )}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      <Textarea
        label="Soru"
        value={form.soruMetni}
        onChange={(e) => setForm((f) => ({ ...f, soruMetni: e.target.value }))}
        placeholder="Soru metnini yazın"
        required
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Cevap Tipi"
          value={form.cevapGirdiTipId}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              cevapGirdiTipId: e.target.value,
              secenekGrupId: '',
            }))
          }
          options={cevapTipiOptions}
          disabled={answerInputTypesQuery.isLoading}
          required
        />

        <Select
          label={trigger ? SECENEK_GRUP_LINKED_LABEL : SECENEK_GRUP_LABEL}
          value={form.secenekGrupId}
          onChange={(e) => {
            setForm((f) => ({
              ...f,
              secenekGrupId: e.target.value,
            }))
            setLinkedChildren((items) => clearLinkedChildTriggers(items))
          }}
          options={secenekGrupOptions}
          disabled={secenekGruplariQuery.isLoading}
          required={showSecenekGrup}
        />
        <Select
          label="Birim"
          value={form.anketCevapBirimId}
          onChange={(e) => setForm((f) => ({ ...f, anketCevapBirimId: e.target.value }))}
          options={birimOptions}
          disabled={answerUnitsQuery.isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            id={`${idPrefix}zorunlu`}
            type="checkbox"
            checked={form.zorunlu}
            onChange={(e) => setForm((f) => ({ ...f, zorunlu: e.target.checked }))}
            className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-foreground">Zorunlu</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            id={`${idPrefix}aktif`}
            type="checkbox"
            checked={form.aktif}
            onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))}
            className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-foreground">Aktif</span>
        </label>
      </div>
    </div>
  )

  const renderLinkedChildrenSection = (parentSecenekGrupId?: number) => (
    <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">Bağlı Sorular (isteğe bağlı)</h4>
        <p className="text-xs text-muted">
          Bu soruya bağlı yeni alt sorular ekleyin. Her alt soru için tam soru bilgilerini
          girebilir ve iç içe bağlantılar oluşturabilirsiniz.
        </p>
      </div>

      <LinkedChildEditor
        children={linkedChildren}
        onChange={setLinkedChildren}
        parentSecenekGrupId={parentSecenekGrupId}
        readOnly={readOnly}
        cevapTipiOptions={cevapTipiOptions}
        secenekGrupOptions={secenekGrupOptions}
        birimOptions={birimOptions}
        answerInputTypes={answerInputTypesQuery.data ?? []}
        secenekGruplariLoading={secenekGruplariQuery.isLoading}
        answerInputTypesLoading={answerInputTypesQuery.isLoading}
        answerUnitsLoading={answerUnitsQuery.isLoading}
      />
    </div>
  )

  return (
    <Card className="border-primary-500/20">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">Yeni Soru Ekle</h3>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Anket Başlığı"
            value={form.baslikId}
            onChange={(e) => {
              setForm((f) => ({ ...f, baslikId: e.target.value }))
              setParentQuestionId('')
              setExistingLinkedQuestionId('')
              setLinkedMigrateResult(null)
              setLinkedConnectionResult(null)
            }}
            options={surveyOptions}
            required
          />
        </div>

        {showMainQuestionFields && renderQuestionFields('main-')}

        {showMainQuestionFields && showLinkedChildrenSection && (
          renderLinkedChildrenSection(
            Number.isFinite(selectedSecenekGrupId) && selectedSecenekGrupId > 0
              ? selectedSecenekGrupId
              : undefined,
          )
        )}

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.bagliSoru}
            onChange={(e) => {
              const checked = e.target.checked
              setForm((f) => ({ ...f, bagliSoru: checked }))
              setLinkedChildren([])
              if (!checked) {
                setParentQuestionId('')
                setExistingLinkedQuestionId('')
                setBagliAltSecenekId('')
                setLinkedMode('yeni')
                setLinkedMigrateResult(null)
                setLinkedConnectionResult(null)
              }
            }}
            className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-foreground">
            Bağlı Soru (mevcut bir soruya bağlanacak)
          </span>
        </label>

        {form.bagliSoru && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted">
              Mevcut bir soruya bağlı soru ekleyin. İç içe bağlantı için bağlı sorunun ID&apos;sini parent
              olarak seçebilirsiniz.
            </p>

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="linked-mode"
                  checked={linkedMode === 'yeni'}
                  onChange={() => {
                    setLinkedMode('yeni')
                  }}
                  className="h-4 w-4 border-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">Yeni bağlı soru oluştur</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="linked-mode"
                  checked={linkedMode === 'mevcut'}
                  onChange={() => {
                    setLinkedMode('mevcut')
                    setLinkedChildren([])
                  }}
                  className="h-4 w-4 border-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">Mevcut soruyu bağla</span>
              </label>
            </div>

            <Select
              label="Bağlı olunacak soru (parent)"
              value={parentQuestionId}
              onChange={(e) => {
                setParentQuestionId(e.target.value)
                setBagliAltSecenekId('')
                setBagliKosulTipi(BAGLI_KOSUL_ESIT)
                if (e.target.value === existingLinkedQuestionId) {
                  setExistingLinkedQuestionId('')
                }
              }}
              options={parentQuestionOptions}
              disabled={!form.baslikId || questionsBySurveyQuery.isLoading}
              required
            />

            {linkedMode === 'mevcut' && parentQuestionId && (
              <div className="space-y-2">
                <AltSecenekSelect
                  key={`link-existing-trigger-${parentSecenekGrupId ?? 'none'}`}
                  id="link-existing-trigger"
                  secenekGrupId={parentSecenekGrupId}
                  label={getBagliSoruTriggerLabel(
                    parentSecenekGrupId
                      ? getSecenekGrupLabel(parentSecenekGrupId) ?? undefined
                      : undefined,
                  )}
                  value={bagliAltSecenekId}
                  onChange={setBagliAltSecenekId}
                  disabled={secenekGruplariQuery.isLoading || !parentSecenekGrupId}
                  required={Boolean(parentSecenekGrupId)}
                />
                {parentSecenekGrupId ? (
                  <>
                    <Select
                      label={GORUNME_KOSULU_LABEL}
                      value={bagliKosulTipi}
                      onChange={(e) => setBagliKosulTipi(e.target.value)}
                      options={BAGLI_KOSUL_TIPI_OPTIONS}
                    />
                    <p className="text-xs text-muted">
                      {getBagliSoruVisibilityHint(
                        getSecenekGrupLabel(parentSecenekGrupId),
                        bagliKosulTipi,
                        { linkedExisting: true },
                      )}
                    </p>
                  </>
                ) : null}
              </div>
            )}

            {linkedMode === 'mevcut' && (
              <Select
                label="Bağlanacak mevcut soru"
                value={existingLinkedQuestionId}
                onChange={(e) => setExistingLinkedQuestionId(e.target.value)}
                options={existingQuestionOptions}
                disabled={!form.baslikId || questionsBySurveyQuery.isLoading}
                required
              />
            )}

            {linkedMode === 'yeni' && (
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-medium text-foreground">Yeni Bağlı Soru Bilgileri</h4>
                {renderQuestionFields('linked-', {
                  secenekGrupId: parentSecenekGrupId,
                  value: bagliAltSecenekId,
                  onChange: setBagliAltSecenekId,
                })}
                {renderLinkedChildrenSection(
                  Number.isFinite(selectedSecenekGrupId) && selectedSecenekGrupId > 0
                    ? selectedSecenekGrupId
                    : undefined,
                )}
              </div>
            )}
          </div>
        )}

        {submitError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {getErrorMessage(submitError)}
          </p>
        )}
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}
        {answerInputTypesQuery.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            Cevap tipi listesi alınamadı.
          </p>
        )}
        {secenekGruplariQuery.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            Seçenek listesi alınamadı.
          </p>
        )}

        {createQuestion.isSuccess && (
          <p className="text-sm text-primary-600">Soru kaydedildi.</p>
        )}
        {createNewLinkedQuestion.isSuccess && (
          <p className="text-sm text-primary-600">Yeni bağlı soru oluşturuldu.</p>
        )}
        {linkedConnectionResult && (
          <p className="text-sm text-primary-600">
            Mevcut soru bağlandı. Bağlantı ID: {linkedConnectionResult.id}
          </p>
        )}
        {linkedMigrateResult && (
          <p className="text-sm text-primary-600">
            Bağlı soru migrate edilerek kaydedildi. Kaynak: {linkedMigrateResult.kaynak ?? 'AppDb'}.
            Yeni Parent ID: {linkedMigrateResult.parentNewQuestionId}, Yeni Bağlı Soru ID:{' '}
            {linkedMigrateResult.newLinkedQuestionId}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={readOnly} loading={isSubmitting}>
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </form>
    </Card>
  )
}
