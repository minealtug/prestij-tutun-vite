import { useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useCografiFiltreOptions } from '@/features/survey-responses/hooks/use-survey-response-filters'
import type { FilterOptionDto } from '@/features/survey-responses/types/survey-response.types'
import {
  getAlimNoktalariForMintika,
  getBolgelerForMensei,
  getKoylerForAlimNoktasi,
  getMintikalarForBolge,
} from '@/features/survey-responses/utils/cografi-filtre'
import type { EkiciDefinitionFormValues } from '../types/ekici-definition.types'
import { formatEkiciDisplayText } from '../utils/format-ekici-display-text'

interface EkiciDefinitionFormProps {
  values: EkiciDefinitionFormValues
  onChange: (values: EkiciDefinitionFormValues) => void
  disabled?: boolean
  idPrefix?: string
  locationLabels?: {
    menseiAdi?: string | null
    bolgeAdi?: string | null
    mintikaAdi?: string | null
    alimNoktasiAdi?: string | null
    koyAdi?: string | null
  }
  uretimMerkeziOptions?: { value: string; label: string }[]
}

const EKICI_DURUM_LABELS: Record<number, string> = {
  1: 'Aktif',
  2: 'Pasif',
}

const CINSIYET_OPTIONS = [
  { value: '', label: 'Cinsiyet seçin' },
  { value: 'Erkek', label: 'Erkek' },
  { value: 'Kadın', label: 'Kadın' },
]

function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted md:col-span-2 xl:col-span-3">
      {children}
    </h3>
  )
}

function toSelectOptions(
  items: FilterOptionDto[],
  placeholder: string,
  selectedId?: number,
  selectedLabel?: string | null,
) {
  const options: { value: string; label: string }[] = [{ value: '', label: placeholder }]
  const seen = new Set<number>()

  for (const item of items) {
    options.push({
      value: String(item.id),
      label: formatEkiciDisplayText(item.adi) || item.adi,
    })
    seen.add(item.id)
  }

  if (selectedId != null && selectedId > 0 && !seen.has(selectedId)) {
    options.push({
      value: String(selectedId),
      label: formatEkiciDisplayText(selectedLabel) || selectedLabel?.trim() || `#${selectedId}`,
    })
  }

  return options
}

function getEkiciDurumOptions(currentId: number) {
  const ids = new Set<number>([1, 2, currentId].filter((id) => id > 0))
  return [
    { value: '', label: 'Durum seçin' },
    ...[...ids].sort((a, b) => a - b).map((id) => ({
      value: String(id),
      label: EKICI_DURUM_LABELS[id] ?? `Durum #${id}`,
    })),
  ]
}

export function EkiciDefinitionForm({
  values,
  onChange,
  disabled = false,
  idPrefix = 'ekici',
  locationLabels,
  uretimMerkeziOptions = [],
}: EkiciDefinitionFormProps) {
  const cografiFiltreQuery = useCografiFiltreOptions()
  const cografiFiltre = cografiFiltreQuery.data

  const set = <K extends keyof EkiciDefinitionFormValues>(key: K, value: EkiciDefinitionFormValues[K]) => {
    onChange({ ...values, [key]: value })
  }

  const bolgeler = useMemo(
    () => (cografiFiltre ? getBolgelerForMensei(cografiFiltre, values.menseiId || undefined) : []),
    [cografiFiltre, values.menseiId],
  )
  const mintikalar = useMemo(
    () => (cografiFiltre ? getMintikalarForBolge(cografiFiltre, values.bolgeId || undefined) : []),
    [cografiFiltre, values.bolgeId],
  )
  const alimNoktalari = useMemo(
    () => (cografiFiltre ? getAlimNoktalariForMintika(cografiFiltre, values.mintikaId || undefined) : []),
    [cografiFiltre, values.mintikaId],
  )
  const koyler = useMemo(
    () =>
      cografiFiltre ? getKoylerForAlimNoktasi(cografiFiltre, values.alimNoktasiId || undefined) : [],
    [cografiFiltre, values.alimNoktasiId],
  )

  const menseiOptions = useMemo(
    () =>
      toSelectOptions(
        cografiFiltre?.menseiler ?? [],
        'Menşei seçin',
        values.menseiId,
        locationLabels?.menseiAdi,
      ),
    [cografiFiltre?.menseiler, values.menseiId, locationLabels?.menseiAdi],
  )
  const bolgeOptions = useMemo(
    () =>
      toSelectOptions(bolgeler, 'Bölge seçin', values.bolgeId, locationLabels?.bolgeAdi),
    [bolgeler, values.bolgeId, locationLabels?.bolgeAdi],
  )
  const mintikaOptions = useMemo(
    () =>
      toSelectOptions(mintikalar, 'Mıntıka seçin', values.mintikaId, locationLabels?.mintikaAdi),
    [mintikalar, values.mintikaId, locationLabels?.mintikaAdi],
  )
  const alimNoktasiOptions = useMemo(
    () =>
      toSelectOptions(
        alimNoktalari,
        'Alım noktası seçin',
        values.alimNoktasiId,
        locationLabels?.alimNoktasiAdi,
      ),
    [alimNoktalari, values.alimNoktasiId, locationLabels?.alimNoktasiAdi],
  )
  const koyOptions = useMemo(
    () => toSelectOptions(koyler, 'Köy seçin', values.koyId, locationLabels?.koyAdi),
    [koyler, values.koyId, locationLabels?.koyAdi],
  )

  const uretimMerkeziSelectOptions = useMemo(() => {
    const options = [{ value: '', label: 'Üretim merkezi seçin' }]
    const seen = new Set<string>()

    for (const option of uretimMerkeziOptions) {
      options.push(option)
      seen.add(option.value)
    }

    if (values.uretimMerkeziId > 0 && !seen.has(String(values.uretimMerkeziId))) {
      options.push({
        value: String(values.uretimMerkeziId),
        label: `Üretim Merkezi ${values.uretimMerkeziId}`,
      })
    }

    return options
  }, [uretimMerkeziOptions, values.uretimMerkeziId])

  const ekiciDurumOptions = useMemo(
    () => getEkiciDurumOptions(values.ekiciDurumId),
    [values.ekiciDurumId],
  )

  const geoDisabled = disabled || cografiFiltreQuery.isLoading

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SectionTitle>Kimlik Bilgileri</SectionTitle>
      <Input
        id={`${idPrefix}-tc`}
        label="TC Kimlik No"
        value={values.tcKimlikNo}
        onChange={(e) => set('tcKimlikNo', e.target.value)}
        disabled={disabled}
        required
      />
      <Input
        id={`${idPrefix}-ad`}
        label="Ad"
        value={values.ad}
        onChange={(e) => set('ad', e.target.value)}
        disabled={disabled}
        required
      />
      <Input
        id={`${idPrefix}-soyad`}
        label="Soyad"
        value={values.soyad}
        onChange={(e) => set('soyad', e.target.value)}
        disabled={disabled}
        required
      />
      <Input
        id={`${idPrefix}-baba`}
        label="Baba Adı"
        value={values.babaAdi}
        onChange={(e) => set('babaAdi', e.target.value)}
        disabled={disabled}
        required
      />
      <Input
        id={`${idPrefix}-ana`}
        label="Ana Adı"
        value={values.anaAdi}
        onChange={(e) => set('anaAdi', e.target.value)}
        disabled={disabled}
      />
      <Input
        id={`${idPrefix}-dogum-yeri`}
        label="Doğum Yeri"
        value={values.dogumYeri}
        onChange={(e) => set('dogumYeri', e.target.value)}
        disabled={disabled}
      />
      <Input
        id={`${idPrefix}-dogum-tarihi`}
        label="Doğum Tarihi"
        type="date"
        value={values.dogumTarihi}
        onChange={(e) => set('dogumTarihi', e.target.value)}
        disabled={disabled}
        required
      />
      <Select
        id={`${idPrefix}-cinsiyet`}
        label="Cinsiyet"
        value={values.cinsiyet}
        options={CINSIYET_OPTIONS}
        disabled={disabled}
        onChange={(e) => set('cinsiyet', e.target.value)}
      />
      <Input
        id={`${idPrefix}-yil`}
        label="Yıl"
        type="number"
        value={Number.isFinite(values.yil) ? String(values.yil) : ''}
        onChange={(e) => set('yil', Number(e.target.value) || new Date().getFullYear())}
        disabled={disabled}
        required
      />

      <SectionTitle>Coğrafi Bilgiler</SectionTitle>
      <Select
        id={`${idPrefix}-mensei`}
        label="Menşei"
        value={values.menseiId > 0 ? String(values.menseiId) : ''}
        options={menseiOptions}
        disabled={geoDisabled}
        required
        onChange={(e) => {
          const menseiId = Number(e.target.value) || 0
          onChange({
            ...values,
            menseiId,
            bolgeId: 0,
            mintikaId: 0,
            alimNoktasiId: 0,
            koyId: 0,
          })
        }}
      />
      <Select
        id={`${idPrefix}-bolge`}
        label="Bölge"
        value={values.bolgeId > 0 ? String(values.bolgeId) : ''}
        options={bolgeOptions}
        disabled={geoDisabled || values.menseiId <= 0}
        required
        onChange={(e) => {
          const bolgeId = Number(e.target.value) || 0
          onChange({
            ...values,
            bolgeId,
            mintikaId: 0,
            alimNoktasiId: 0,
            koyId: 0,
          })
        }}
      />
      <Select
        id={`${idPrefix}-mintika`}
        label="Mıntıka"
        value={values.mintikaId > 0 ? String(values.mintikaId) : ''}
        options={mintikaOptions}
        disabled={geoDisabled || values.bolgeId <= 0}
        required
        onChange={(e) => {
          const mintikaId = Number(e.target.value) || 0
          onChange({
            ...values,
            mintikaId,
            alimNoktasiId: 0,
            koyId: 0,
          })
        }}
      />
      <Select
        id={`${idPrefix}-alim`}
        label="Alım Noktası"
        value={values.alimNoktasiId > 0 ? String(values.alimNoktasiId) : ''}
        options={alimNoktasiOptions}
        disabled={geoDisabled || values.mintikaId <= 0}
        required
        onChange={(e) => {
          const alimNoktasiId = Number(e.target.value) || 0
          onChange({
            ...values,
            alimNoktasiId,
            koyId: 0,
          })
        }}
      />
      <Select
        id={`${idPrefix}-koy`}
        label="Köy"
        value={values.koyId > 0 ? String(values.koyId) : ''}
        options={koyOptions}
        disabled={geoDisabled || values.alimNoktasiId <= 0}
        required
        onChange={(e) => set('koyId', Number(e.target.value) || 0)}
      />
      <SearchableSelect
        label="Üretim Merkezi"
        value={values.uretimMerkeziId > 0 ? String(values.uretimMerkeziId) : ''}
        options={uretimMerkeziSelectOptions}
        placeholder="Üretim merkezi ara veya seç..."
        emptyMessage="Üretim merkezi bulunamadı"
        disabled={disabled}
        onChange={(value) => set('uretimMerkeziId', Number(value) || 0)}
      />

      <SectionTitle>Ek Bilgiler</SectionTitle>
      <Input
        id={`${idPrefix}-ozkont`}
        label="Öz Kontrol No"
        type="number"
        value={Number.isFinite(values.ozKontNo) ? String(values.ozKontNo) : ''}
        onChange={(e) => set('ozKontNo', Number(e.target.value) || 0)}
        disabled={disabled}
      />
      <Input
        id={`${idPrefix}-makine`}
        label="Makine Kodu"
        value={values.makineKodu}
        onChange={(e) => set('makineKodu', e.target.value.slice(0, 3))}
        disabled={disabled}
        maxLength={3}
        placeholder="Örn. 001"
        required
      />
      <Select
        id={`${idPrefix}-durum`}
        label="Ekici Durumu"
        value={values.ekiciDurumId > 0 ? String(values.ekiciDurumId) : ''}
        options={ekiciDurumOptions}
        disabled={disabled}
        required
        onChange={(e) => set('ekiciDurumId', Number(e.target.value) || 1)}
      />

      <SectionTitle>Durum</SectionTitle>
      <div className="md:col-span-2 xl:col-span-3">
        <CheckboxField
          label="Aktif"
          checked={values.aktif === 1}
          disabled={disabled}
          onChange={(checked) => set('aktif', checked ? 1 : 0)}
        />
      </div>
      <CheckboxField
        label="İcralık"
        checked={values.icralik}
        disabled={disabled}
        onChange={(checked) => set('icralik', checked)}
      />
      <CheckboxField
        label="Temlik"
        checked={values.temlik}
        disabled={disabled}
        onChange={(checked) => set('temlik', checked)}
      />
      <CheckboxField
        label="Sözleşme İptal"
        checked={values.sozlesmeIptal}
        disabled={disabled}
        onChange={(checked) => set('sozlesmeIptal', checked)}
      />
    </div>
  )
}
