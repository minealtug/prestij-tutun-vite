import type { CografiFiltreOptionsDto, CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type { AnketGirisDurumuSayilari } from '@/features/survey-responses/types/survey-response.types'
import type { MintikaEkiciFillRow } from './compute-ekici-survey-coverage'

export interface CografiFillRowLabels {
  menseiAdi?: string
  bolgeAdi?: string
  mintikaAdi?: string
  alimNoktasiAdi?: string
  koyAdi?: string
}

function findAdi(
  items: { id: number; adi: string }[] | undefined,
  id: number | undefined,
): string | undefined {
  if (!id) return undefined
  return items?.find((item) => item.id === id)?.adi?.trim() || undefined
}

export function getCografiFillRowLabels(
  options: CografiFiltreOptionsDto | undefined,
  params: CografiFiltreQueryParams,
): CografiFillRowLabels {
  return {
    menseiAdi: findAdi(options?.menseiler, params.menseiId),
    bolgeAdi: findAdi(options?.bolgeler, params.bolgeId),
    mintikaAdi: findAdi(options?.mintikalar, params.mintikaId),
    alimNoktasiAdi: findAdi(options?.alimNoktalari, params.alimNoktasiId),
    koyAdi: findAdi(options?.koyler, params.koyId),
  }
}

/** En küçük kırılımdan en büyüğe: köy → alım noktası → mıntıka → bölge → menşei. */
const GEO_LEVELS = [
  { key: 'koy', fallbackLabel: 'Köy', countKey: 'koyEkiciSayisi', labelKey: 'koyAdi' },
  {
    key: 'alimNoktasi',
    fallbackLabel: 'Alım noktası',
    countKey: 'alimNoktasiEkiciSayisi',
    labelKey: 'alimNoktasiAdi',
  },
  { key: 'mintika', fallbackLabel: 'Mıntıka', countKey: 'mintikaEkiciSayisi', labelKey: 'mintikaAdi' },
  { key: 'bolge', fallbackLabel: 'Bölge', countKey: 'bolgeEkiciSayisi', labelKey: 'bolgeAdi' },
  { key: 'mensei', fallbackLabel: 'Menşei', countKey: 'menseiEkiciSayisi', labelKey: 'menseiAdi' },
] as const

export function buildCografiEkiciFillRows(
  counts: AnketGirisDurumuSayilari | undefined,
  labels: CografiFillRowLabels = {},
): MintikaEkiciFillRow[] {
  if (!counts) return []

  const smallest = GEO_LEVELS.find((level) => counts[level.countKey] != null)
  if (!smallest) return []

  return [
    {
      key: smallest.key,
      label: labels[smallest.labelKey] || smallest.fallbackLabel,
      totalEkici: counts.toplamEkiciSayisi,
      completedEkici: counts.tamamlananAnketSayisi,
      partialEkici: counts.yarimKalanAnketSayisi,
      untouchedEkici: counts.girisYokSayisi,
    },
  ]
}
