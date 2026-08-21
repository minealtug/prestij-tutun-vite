import { Select } from '@/components/ui/Select'
import type { CografiFiltreCascadeValues } from '../types'

interface CografiFiltreFieldsProps {
  values: CografiFiltreCascadeValues
  selectOptions: {
    mensei: { value: string; label: string }[]
    bolge: { value: string; label: string }[]
    mintika: { value: string; label: string }[]
    alimNoktasi: { value: string; label: string }[]
    koy: { value: string; label: string }[]
  }
  lockedLevels?: {
    mensei?: boolean
    bolge?: boolean
    mintika?: boolean
  }
  disabled?: boolean
  onMenseiChange: (value: string) => void
  onBolgeChange: (value: string) => void
  onMintikaChange: (value: string) => void
  onAlimNoktasiChange: (value: string) => void
  onKoyChange: (value: string) => void
  className?: string
}

export function CografiFiltreFields({
  values,
  selectOptions,
  lockedLevels,
  disabled = false,
  onMenseiChange,
  onBolgeChange,
  onMintikaChange,
  onAlimNoktasiChange,
  onKoyChange,
  className = 'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}: CografiFiltreFieldsProps) {
  const fieldDisabled = disabled

  return (
    <div className={className}>
      <Select
        label="Menşei"
        value={values.menseiId}
        onChange={(e) => onMenseiChange(e.target.value)}
        options={selectOptions.mensei}
        disabled={fieldDisabled || lockedLevels?.mensei}
      />
      <Select
        label="Bölge"
        value={values.bolgeId}
        onChange={(e) => onBolgeChange(e.target.value)}
        options={selectOptions.bolge}
        disabled={fieldDisabled || lockedLevels?.bolge || !values.menseiId}
      />
      <Select
        label="Mıntıka"
        value={values.mintikaId}
        onChange={(e) => onMintikaChange(e.target.value)}
        options={selectOptions.mintika}
        disabled={fieldDisabled || lockedLevels?.mintika}
      />
      <Select
        label="Alım noktası"
        value={values.alimNoktasiId}
        onChange={(e) => onAlimNoktasiChange(e.target.value)}
        options={selectOptions.alimNoktasi}
        disabled={fieldDisabled}
      />
      <Select
        label="Köy"
        value={values.koyId}
        onChange={(e) => onKoyChange(e.target.value)}
        options={selectOptions.koy}
        disabled={fieldDisabled || !values.alimNoktasiId}
      />
    </div>
  )
}
