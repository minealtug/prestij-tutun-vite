import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'

export const DEFAULT_SURVEY_FILL_BASLIK_ID = 8

export interface SurveyFillDeepLinkParams extends CografiFiltreQueryParams {
  baslikId: number
  sablonId?: number
  ekiciId: string
  duzenle?: boolean
  /** Cevapladığım Anketler’den kendi cevabını düzenleme */
  kendiCevap?: boolean
}

function parsePositiveIntParam(value: string | null): number | undefined {
  if (!value?.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function buildSurveyFillDeepLink(params: SurveyFillDeepLinkParams): string {
  const search = new URLSearchParams()
  search.set('baslikId', String(params.baslikId))
  if (params.sablonId != null && params.sablonId > 0) {
    search.set('sablonId', String(params.sablonId))
  }
  search.set('ekiciId', params.ekiciId)
  if (params.menseiId != null && params.menseiId > 0) {
    search.set('menseiId', String(params.menseiId))
  }
  if (params.bolgeId != null && params.bolgeId > 0) {
    search.set('bolgeId', String(params.bolgeId))
  }
  if (params.mintikaId != null && params.mintikaId > 0) {
    search.set('mintikaId', String(params.mintikaId))
  }
  if (params.alimNoktasiId != null && params.alimNoktasiId > 0) {
    search.set('alimNoktasiId', String(params.alimNoktasiId))
  }
  if (params.koyId != null && params.koyId > 0) {
    search.set('koyId', String(params.koyId))
  }
  if (params.duzenle) {
    search.set('duzenle', '1')
  }
  if (params.kendiCevap) {
    search.set('kendi', '1')
  }
  return `/anket-doldurma?${search.toString()}`
}

export function parseSurveyFillDeepLink(
  searchParams: URLSearchParams,
): SurveyFillDeepLinkParams | null {
  const baslikId = parsePositiveIntParam(searchParams.get('baslikId'))
  const ekiciId = searchParams.get('ekiciId')?.trim()
  if (baslikId == null || !ekiciId) return null

  return {
    baslikId,
    sablonId: parsePositiveIntParam(searchParams.get('sablonId')),
    ekiciId,
    menseiId: parsePositiveIntParam(searchParams.get('menseiId')),
    bolgeId: parsePositiveIntParam(searchParams.get('bolgeId')),
    mintikaId: parsePositiveIntParam(searchParams.get('mintikaId')),
    alimNoktasiId: parsePositiveIntParam(searchParams.get('alimNoktasiId')),
    koyId: parsePositiveIntParam(searchParams.get('koyId')),
    duzenle: searchParams.get('duzenle') === '1',
    kendiCevap: searchParams.get('kendi') === '1',
  }
}

export function buildSurveyFillLinkFromEkici(params: {
  baslikId: number
  sablonId?: number
  ekici: {
    id: string
    menseiId: number
    bolgeId: number
    mintikaId: number
    alimNoktasiId: number
    koyId: number
  }
}): string {
  return buildSurveyFillDeepLink({
    baslikId: params.baslikId,
    sablonId: params.sablonId,
    ekiciId: params.ekici.id,
    menseiId: params.ekici.menseiId,
    bolgeId: params.ekici.bolgeId,
    mintikaId: params.ekici.mintikaId,
    alimNoktasiId: params.ekici.alimNoktasiId,
    koyId: params.ekici.koyId,
  })
}
