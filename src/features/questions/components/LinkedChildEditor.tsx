import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { CevapGirdiTipDto } from '../types/question.types'
import { BAGLI_KOSUL_ESIT, BAGLI_KOSUL_TIPI_OPTIONS } from '../utils/bagli-kosul-tipi'
import { needsSecenekGrup } from '../utils/needs-secenek-grup'
import {
  GORUNME_KOSULU_LABEL,
  SECENEK_GRUP_LINKED_LABEL,
  getBagliSoruTriggerLabel,
} from '../utils/question-field-labels'
import { AltSecenekSelect } from './AltSecenekSelect'
import { AltSecenekMultiSelect } from './AltSecenekMultiSelect'

export interface LinkedChildDraft {
  key: string
  cevapGirdiTipId: string
  secenekGrupId: string
  altSecenekIds: number[]
  bagliAltSecenekId: string
  bagliKosulTipi: string
  anketCevapBirimId: string
  soruMetni: string
  zorunlu: boolean
  aktif: boolean
  children: LinkedChildDraft[]
}

let linkedChildKey = 0

export function createLinkedChildDraft(): LinkedChildDraft {
  linkedChildKey += 1
  return {
    key: `linked-child-${linkedChildKey}`,
    cevapGirdiTipId: '',
    secenekGrupId: '',
    altSecenekIds: [],
    bagliAltSecenekId: '',
    bagliKosulTipi: BAGLI_KOSUL_ESIT,
    anketCevapBirimId: '',
    soruMetni: '',
    zorunlu: true,
    aktif: true,
    children: [],
  }
}

interface LinkedChildEditorProps {
  children: LinkedChildDraft[]
  onChange: (children: LinkedChildDraft[]) => void
  parentSecenekGrupId?: number
  parentAltSecenekIds?: number[]
  depth?: number
  readOnly?: boolean
  cevapTipiOptions: { value: string; label: string }[]
  secenekGrupOptions: { value: string; label: string }[]
  birimOptions: { value: string; label: string }[]
  answerInputTypes: CevapGirdiTipDto[]
  secenekGruplariLoading: boolean
  answerInputTypesLoading: boolean
  answerUnitsLoading: boolean
}

function updateChild(
  items: LinkedChildDraft[],
  key: string,
  updater: (child: LinkedChildDraft) => LinkedChildDraft,
): LinkedChildDraft[] {
  return items.map((item) => {
    if (item.key === key) return updater(item)
    if (item.children.length > 0) {
      return { ...item, children: updateChild(item.children, key, updater) }
    }
    return item
  })
}

function removeChild(items: LinkedChildDraft[], key: string): LinkedChildDraft[] {
  return items
    .filter((item) => item.key !== key)
    .map((item) => ({
      ...item,
      children: removeChild(item.children, key),
    }))
}

function getSecenekGrupLabel(
  secenekGrupOptions: { value: string; label: string }[],
  secenekGrupId?: number,
) {
  if (!secenekGrupId) return undefined
  return secenekGrupOptions.find((option) => Number(option.value) === secenekGrupId)?.label
}

function clearNestedTriggers(items: LinkedChildDraft[]): LinkedChildDraft[] {
  return items.map((child) => ({
    ...child,
    bagliAltSecenekId: '',
    bagliKosulTipi: BAGLI_KOSUL_ESIT,
    children: clearNestedTriggers(child.children),
  }))
}

export function LinkedChildEditor({
  children,
  onChange,
  parentSecenekGrupId,
  parentAltSecenekIds,
  depth = 0,
  readOnly = false,
  cevapTipiOptions,
  secenekGrupOptions,
  birimOptions,
  answerInputTypes,
  secenekGruplariLoading,
  answerInputTypesLoading,
  answerUnitsLoading,
}: LinkedChildEditorProps) {
  const addChild = () => onChange([...children, createLinkedChildDraft()])

  const updateChildField = (key: string, updater: (child: LinkedChildDraft) => LinkedChildDraft) => {
    onChange(updateChild(children, key, updater))
  }

  const removeChildItem = (key: string) => {
    onChange(removeChild(children, key))
  }

  if (children.length === 0 && depth === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Henüz bağlı soru eklenmedi.</p>
        <Button type="button" variant="outline" size="sm" disabled={readOnly} onClick={addChild}>
          <Plus className="h-4 w-4" />
          Bağlı soru ekle
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {children.map((child, index) => {
        const selectedAnswerType = answerInputTypes.find(
          (item) => String(item.id) === child.cevapGirdiTipId,
        )
        const showSecenekGrup = selectedAnswerType
          ? needsSecenekGrup(selectedAnswerType.adi)
          : false
        const parentTriggerGrupLabel = getSecenekGrupLabel(secenekGrupOptions, parentSecenekGrupId)
        const triggerLabel = getBagliSoruTriggerLabel(parentTriggerGrupLabel)

        return (
          <div
            key={child.key}
            className="space-y-4 rounded-lg border border-border bg-background p-4"
            style={{ marginLeft: depth > 0 ? `${depth * 12}px` : undefined }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {depth > 0 ? 'Alt bağlı soru' : 'Bağlı soru'} {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="!h-8 !px-2 text-red-600"
                disabled={readOnly}
                onClick={() => removeChildItem(child.key)}
              >
                <Trash2 className="h-4 w-4" />
                Kaldır
              </Button>
            </div>

            {parentSecenekGrupId ? (
              <div className="space-y-2">
                <AltSecenekSelect
                  key={`trigger-${child.key}-${parentSecenekGrupId ?? 'none'}`}
                  id={`trigger-${child.key}`}
                  secenekGrupId={parentSecenekGrupId}
                  allowedAltSecenekIds={parentAltSecenekIds}
                  label={triggerLabel}
                  value={child.bagliAltSecenekId}
                  onChange={(nextValue) =>
                    updateChildField(child.key, (item) => ({
                      ...item,
                      bagliAltSecenekId: nextValue,
                    }))
                  }
                  disabled={secenekGruplariLoading || !parentSecenekGrupId}
                  required={Boolean(parentSecenekGrupId)}
                />
                <Select
                  label={GORUNME_KOSULU_LABEL}
                  value={child.bagliKosulTipi}
                  onChange={(e) =>
                    updateChildField(child.key, (item) => ({
                      ...item,
                      bagliKosulTipi: e.target.value,
                    }))
                  }
                  options={BAGLI_KOSUL_TIPI_OPTIONS}
                  disabled={readOnly}
                />
              </div>
            ) : null}

            <Textarea
              label="Soru"
              value={child.soruMetni}
              onChange={(e) =>
                updateChildField(child.key, (item) => ({ ...item, soruMetni: e.target.value }))
              }
              placeholder="Bağlı soru metnini yazın"
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Cevap Tipi"
                value={child.cevapGirdiTipId}
                onChange={(e) =>
                  updateChildField(child.key, (item) => ({
                    ...item,
                    cevapGirdiTipId: e.target.value,
                    secenekGrupId: '',
                    altSecenekIds: [],
                    children: clearNestedTriggers(item.children),
                  }))
                }
                options={cevapTipiOptions}
                disabled={answerInputTypesLoading}
                required
              />

              <Select
                label={SECENEK_GRUP_LINKED_LABEL}
                value={child.secenekGrupId}
                onChange={(e) =>
                  updateChildField(child.key, (item) => ({
                    ...item,
                    secenekGrupId: e.target.value,
                    altSecenekIds: [],
                    children: clearNestedTriggers(item.children),
                  }))
                }
                options={secenekGrupOptions}
                disabled={secenekGruplariLoading}
              />
            </div>

            {showSecenekGrup && child.secenekGrupId ? (
              <AltSecenekMultiSelect
                id={`child-alt-${child.key}`}
                secenekGrupId={Number(child.secenekGrupId)}
                value={child.altSecenekIds}
                onChange={(nextIds) =>
                  updateChildField(child.key, (item) => ({
                    ...item,
                    altSecenekIds: nextIds,
                    children: clearNestedTriggers(item.children),
                  }))
                }
                disabled={secenekGruplariLoading}
              />
            ) : null}

            <Select
              label="Birim"
              value={child.anketCevapBirimId}
              onChange={(e) =>
                updateChildField(child.key, (item) => ({
                  ...item,
                  anketCevapBirimId: e.target.value,
                }))
              }
              options={birimOptions}
              disabled={answerUnitsLoading}
            />

            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={child.zorunlu}
                  onChange={(e) =>
                    updateChildField(child.key, (item) => ({ ...item, zorunlu: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">Zorunlu</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={child.aktif}
                  onChange={(e) =>
                    updateChildField(child.key, (item) => ({ ...item, aktif: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">Aktif</span>
              </label>
            </div>

            {child.secenekGrupId && (
              <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-medium text-foreground">Alt Bağlı Sorular</h5>
                    <p className="text-xs text-muted">
                      Alt sorular, bu sorunun cevap seçenekleri (
                      {getSecenekGrupLabel(secenekGrupOptions, Number(child.secenekGrupId)) ??
                        `Liste #${child.secenekGrupId}`}
                      ) üzerinden açılır.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={readOnly}
                    onClick={() =>
                      updateChildField(child.key, (item) => ({
                        ...item,
                        children: [...item.children, createLinkedChildDraft()],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Alt bağlı soru ekle
                  </Button>
                </div>

                {child.children.length > 0 && (
                  <LinkedChildEditor
                    children={child.children}
                    onChange={(nested) =>
                      updateChildField(child.key, (item) => ({ ...item, children: nested }))
                    }
                    parentSecenekGrupId={
                      Number.isFinite(Number(child.secenekGrupId)) && Number(child.secenekGrupId) > 0
                        ? Number(child.secenekGrupId)
                        : undefined
                    }
                    parentAltSecenekIds={
                      child.altSecenekIds.length > 0 ? child.altSecenekIds : undefined
                    }
                    depth={depth + 1}
                    readOnly={readOnly}
                    cevapTipiOptions={cevapTipiOptions}
                    secenekGrupOptions={secenekGrupOptions}
                    birimOptions={birimOptions}
                    answerInputTypes={answerInputTypes}
                    secenekGruplariLoading={secenekGruplariLoading}
                    answerInputTypesLoading={answerInputTypesLoading}
                    answerUnitsLoading={answerUnitsLoading}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}

      {depth === 0 && (
        <Button type="button" variant="outline" size="sm" disabled={readOnly} onClick={addChild}>
          <Plus className="h-4 w-4" />
          Bağlı soru ekle
        </Button>
      )}
    </div>
  )
}
