import type {
  AlimNoktasiDto,
  BolgeDto,
  CografiFiltreOptionsDto,
  FilterOptionDto,
  KoyDto,
  MintikaDto,
} from '../types/survey-response.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function mapFilterOption(raw: unknown): FilterOptionDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  const adi = String(pick(row, 'adi', 'Adi') ?? '').trim()
  if (!Number.isFinite(id) || !adi) return null
  return { id, adi }
}

function mapBolge(raw: unknown): BolgeDto | null {
  const row = asRecord(raw)
  const base = mapFilterOption(raw)
  const menseiId = Number(pick(row, 'menseiId', 'MenseiId'))
  if (!base || !Number.isFinite(menseiId)) return null
  return { ...base, menseiId }
}

function mapMintika(raw: unknown): MintikaDto | null {
  const row = asRecord(raw)
  const base = mapFilterOption(raw)
  const bolgeId = Number(pick(row, 'bolgeId', 'BolgeId'))
  if (!base || !Number.isFinite(bolgeId)) return null
  return { ...base, bolgeId }
}

function mapAlimNoktasi(raw: unknown): AlimNoktasiDto | null {
  const row = asRecord(raw)
  const base = mapFilterOption(raw)
  const mintikaId = Number(pick(row, 'mintikaId', 'MintikaId'))
  if (!base || !Number.isFinite(mintikaId)) return null
  return { ...base, mintikaId }
}

function mapKoy(raw: unknown): KoyDto | null {
  const row = asRecord(raw)
  const base = mapFilterOption(raw)
  const alimNoktasiId = Number(pick(row, 'alimNoktasiId', 'AlimNoktasiId'))
  if (!base || !Number.isFinite(alimNoktasiId)) return null
  return { ...base, alimNoktasiId }
}

function mapList<T>(items: unknown, mapper: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(items)) return []
  return items.map(mapper).filter((item): item is T => item !== null)
}

export function mapCografiFiltreOptionsFromApi(raw: unknown): CografiFiltreOptionsDto {
  const row = asRecord(raw)
  return {
    menseiler: mapList(row.menseiler ?? row.Menseiler, mapFilterOption),
    bolgeler: mapList(row.bolgeler ?? row.Bolgeler, mapBolge),
    mintikalar: mapList(row.mintikalar ?? row.Mintikalar, mapMintika),
    alimNoktalari: mapList(row.alimNoktalari ?? row.AlimNoktalari, mapAlimNoktasi),
    koyler: mapList(row.koyler ?? row.Koyler, mapKoy),
  }
}

export function getBolgelerForMensei(
  options: CografiFiltreOptionsDto,
  menseiId?: number,
): BolgeDto[] {
  if (!menseiId) return options.bolgeler
  return options.bolgeler.filter((item) => item.menseiId === menseiId)
}

export function getMintikalarForBolge(
  options: CografiFiltreOptionsDto,
  bolgeId?: number,
): MintikaDto[] {
  if (!bolgeId) return options.mintikalar
  return options.mintikalar.filter((item) => item.bolgeId === bolgeId)
}

export function getAlimNoktalariForMintika(
  options: CografiFiltreOptionsDto,
  mintikaId?: number,
): AlimNoktasiDto[] {
  if (!mintikaId) return options.alimNoktalari
  return options.alimNoktalari.filter((item) => item.mintikaId === mintikaId)
}

export function getKoylerForAlimNoktasi(
  options: CografiFiltreOptionsDto,
  alimNoktasiId?: number,
): KoyDto[] {
  if (!alimNoktasiId) return options.koyler
  return options.koyler.filter((item) => item.alimNoktasiId === alimNoktasiId)
}
