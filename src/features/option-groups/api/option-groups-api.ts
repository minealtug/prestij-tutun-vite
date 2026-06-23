import { apiClient } from '@/lib/api/api-client'
import { anketAltSecenekApi } from '@/features/questions/api/anket-alt-secenek-api'
import type {
  CreateSecenekGrupRequest,
  SecenekGrupDto,
  UpdateSecenekGrupRequest,
} from '../types/option-group.types'
import {
  groupAltSeceneklerIntoGruplar,
  mapSecenekGrupFromApi,
} from '../utils/normalize-option-group-api'

function buildAltSeceneklerMetni(altSecenekler: { adi: string }[]): string {
  return altSecenekler
    .map((item) => item.adi.trim())
    .filter((adi) => adi.length > 0)
    .join(';')
}

export const optionGroupsApi = {
  getAll: async (): Promise<SecenekGrupDto[]> => {
    const altSecenekler = await anketAltSecenekApi.getAll()
    return groupAltSeceneklerIntoGruplar(altSecenekler)
  },

  create: async (payload: CreateSecenekGrupRequest): Promise<SecenekGrupDto> => {
    const altSeceneklerMetni = buildAltSeceneklerMetni(payload.altSecenekler)
    const raw = await apiClient.post<unknown>('/api/AnketSecenekGrup/with-alt-secenekler', {
      grupAdi: payload.grupAdi.trim(),
      altSeceneklerMetni,
    })
    const mapped = mapSecenekGrupFromApi(raw)
    if (mapped) return mapped

    const items = await optionGroupsApi.getAll()
    const found = items.find((item) => {
      const names = item.altSecenekler.map((alt) => alt.adi).join(';')
      return names === altSeceneklerMetni
    })
    if (found) return found
    throw new Error('Seçenek grubu oluşturuldu ancak yanıt okunamadı.')
  },

  update: async (
    secenekGrupId: number,
    payload: UpdateSecenekGrupRequest,
  ): Promise<SecenekGrupDto> => {
    const existing = await anketAltSecenekApi.getBySecenekGrupId(secenekGrupId)
    const nextIds = new Set(
      payload.altSecenekler
        .map((item) => item.id)
        .filter((id): id is number => id != null && id > 0),
    )

    for (const item of existing) {
      if (!nextIds.has(item.id)) {
        await anketAltSecenekApi.delete(item.id)
      }
    }

    for (const item of payload.altSecenekler) {
      if (item.id) {
        await anketAltSecenekApi.update(item.id, {
          secenekGrupId,
          adi: item.adi,
          siraNo: item.siraNo,
        })
      } else {
        await anketAltSecenekApi.create({
          secenekGrupId,
          adi: item.adi,
          siraNo: item.siraNo,
        })
      }
    }

    const refreshed = await anketAltSecenekApi.getBySecenekGrupId(secenekGrupId)
    return {
      secenekGrupId,
      grupAdi: payload.grupAdi.trim(),
      altSecenekler: refreshed,
    }
  },

  delete: async (secenekGrupId: number): Promise<void> => {
    const items = await anketAltSecenekApi.getBySecenekGrupId(secenekGrupId)
    await Promise.all(items.map((item) => anketAltSecenekApi.delete(item.id)))
  },
}
