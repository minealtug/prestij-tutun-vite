import { useEffect } from 'react'
import { Select } from '@/components/ui/Select'
import { useAltSeceneklerByGrupId } from '../hooks/use-alt-secenekler-by-grup'
import { buildAltSecenekOptionsFromQuery } from '../utils/build-alt-secenek-options'
import {
  ALT_SECENEK_LABEL,
  ALT_SECENEK_LOADING,
  ALT_SECENEK_NEED_SECENEK_GRUP,
} from '../utils/question-field-labels'

interface AltSecenekSelectProps {
  secenekGrupId?: number
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

export function AltSecenekSelect({
  secenekGrupId,
  value,
  onChange,
  label = ALT_SECENEK_LABEL,
  required = false,
  disabled = false,
  id,
}: AltSecenekSelectProps) {
  const parsedGrupId =
    Number.isFinite(secenekGrupId) && (secenekGrupId ?? 0) > 0 ? secenekGrupId : undefined
  const query = useAltSeceneklerByGrupId(parsedGrupId)
  const options =
    query.isLoading || query.isFetching
      ? [{ value: '', label: ALT_SECENEK_LOADING }]
      : buildAltSecenekOptionsFromQuery(query.data ?? [], parsedGrupId)

  useEffect(() => {
    if (!value || !parsedGrupId || query.isLoading || query.isFetching) return
    const isValid = options.some((option) => option.value === value)
    if (!isValid) {
      onChange('')
    }
  }, [onChange, options, parsedGrupId, query.isFetching, query.isLoading, value])

  if (!parsedGrupId) {
    return (
      <Select
        id={id}
        label={label}
        value=""
        onChange={() => undefined}
        options={[{ value: '', label: ALT_SECENEK_NEED_SECENEK_GRUP }]}
        disabled
        required={required}
      />
    )
  }

  return (
    <Select
      id={id}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      disabled={disabled || query.isLoading}
      required={required}
    />
  )
}
