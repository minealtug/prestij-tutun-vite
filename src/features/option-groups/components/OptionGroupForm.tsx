import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { SecenekGrupFormValues } from '../types/option-group.types'

interface OptionGroupFormProps {
  values: SecenekGrupFormValues
  onChange: (values: SecenekGrupFormValues) => void
  disabled?: boolean
  idPrefix?: string
  disableGrupAdi?: boolean
}

export function OptionGroupForm({
  values,
  onChange,
  disabled = false,
  idPrefix = 'option-group',
  disableGrupAdi = false,
}: OptionGroupFormProps) {
  const updateAltSecenek = (index: number, adi: string) => {
    const next = [...values.altSecenekler]
    next[index] = { ...next[index], adi }
    onChange({ ...values, altSecenekler: next })
  }

  const addAltSecenek = () => {
    onChange({ ...values, altSecenekler: [...values.altSecenekler, { adi: '' }] })
  }

  const removeAltSecenek = (index: number) => {
    if (values.altSecenekler.length <= 1) return
    const next = values.altSecenekler.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...values, altSecenekler: next })
  }

  return (
    <div className="space-y-4">
      <Input
        id={`${idPrefix}-grup-adi`}
        label="Grup Adı"
        value={values.grupAdi}
        onChange={(e) => onChange({ ...values, grupAdi: e.target.value })}
        placeholder="Örn: Memnuniyet düzeyi"
        disabled={disabled || disableGrupAdi}
      />
      {disableGrupAdi && (
        <p className="-mt-2 text-xs text-muted">Grup adı yalnızca oluşturma sırasında tanımlanabilir.</p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Seçenekler</p>
        <p className="text-xs text-muted">
          Sorularda kullanılacak cevap seçeneklerini sırayla ekleyin.
        </p>

        <div className="space-y-2">
          {values.altSecenekler.map((item, index) => (
            <div key={`${idPrefix}-option-${item.id ?? index}`} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  id={`${idPrefix}-option-${index}`}
                  label={index === 0 ? 'Seçenek' : undefined}
                  value={item.adi}
                  onChange={(e) => updateAltSecenek(index, e.target.value)}
                  placeholder={`Seçenek ${index + 1}`}
                  disabled={disabled}
                  required={index === 0}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Seçeneği kaldır"
                disabled={disabled || values.altSecenekler.length <= 1}
                onClick={() => removeAltSecenek(index)}
                className="mb-0.5 shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addAltSecenek}
        >
          <Plus className="h-4 w-4" />
          Seçenek Ekle
        </Button>
      </div>
    </div>
  )
}
