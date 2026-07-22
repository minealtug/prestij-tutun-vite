import type {
  BandValue,
  YasCinsiyetReport,
  YasCinsiyetRow,
  YasCinsiyetTotals,
} from '../types/yas-cinsiyet-report.types'

type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' ? (value as Raw) : {}
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function pick(node: Raw, keys: string[]): unknown {
  for (const key of keys) {
    if (node[key] != null) return node[key]
  }
  return undefined
}

function name(node: Raw, keys: string[]): string {
  const value = pick(node, keys)
  return typeof value === 'string' ? value.trim() : value != null ? String(value) : ''
}

function firstArray(node: Raw, keys: string[]): unknown[] {
  for (const key of keys) {
    if (Array.isArray(node[key])) return node[key] as unknown[]
  }
  return []
}

function toBand(value: unknown): BandValue {
  const raw = asRecord(value)
  return {
    erkek: num(pick(raw, ['erkek', 'Erkek'])),
    kadin: num(pick(raw, ['kadin', 'Kadin', 'kadın'])),
    toplam: num(pick(raw, ['toplam', 'Toplam'])),
  }
}

const MENSEI_NAME = ['menseiAdi', 'menseiAd', 'mensei', 'ad', 'adi', 'adı', 'isim', 'name']
const BOLGE_NAME = ['bolgeAdi', 'bolgeAd', 'bolge', 'ad', 'adi', 'adı', 'isim', 'name']
const MINTIKA_NAME = ['mintikaAdi', 'mintikaAd', 'mintika', 'ad', 'adi', 'adı', 'isim', 'name']
const ALIM_NAME = [
  'alimNoktasiAdi',
  'alimNoktaAdi',
  'alimNoktasiAd',
  'alimNoktasi',
  'ad',
  'adi',
  'adı',
  'isim',
  'name',
]

const BOLGE_ARR = ['bolgeler', 'Bolgeler', 'bolge', 'bolgeList']
const MINTIKA_ARR = ['mintikalar', 'Mintikalar', 'mintika', 'mintikaList']
const ALIM_ARR = [
  'alimNoktalari',
  'AlimNoktalari',
  'alimNoktaları',
  'alimNoktalar',
  'alimNoktasilari',
  'alimNoktalariList',
]

export function normalizeYasCinsiyetReport(
  raw: unknown,
  bandKeys: string[],
  totalKey: string,
): YasCinsiyetReport {
  const totalKeys = [totalKey, 'genelToplam', 'toplam']

  const toTotals = (node: Raw): YasCinsiyetTotals => {
    // Sayılar seviyeye göre `counts` (alım noktası) veya `totals` (üst kırılım)
    // içinde gelir; yoksa düğümün kendisinden okunur (ör. genelToplam).
    const c = asRecord(pick(node, ['counts', 'Counts', 'totals', 'Totals']) ?? node)
    const bands: Record<string, BandValue> = {}
    for (const key of bandKeys) {
      bands[key] = toBand(c[key])
    }
    return { bands, grupToplam: num(pick(c, totalKeys)) }
  }

  const root = asRecord(raw)
  const menseiler = firstArray(root, ['menseiler', 'Menseiler'])
  const rows: YasCinsiyetRow[] = []

  const pushRow = (
    menseiAd: string,
    bolgeAd: string,
    mintikaAd: string,
    alimNoktasiAd: string,
    node: Raw,
  ) => {
    rows.push({ menseiAd, bolgeAd, mintikaAd, alimNoktasiAd, ...toTotals(node) })
  }

  for (const menseiRaw of menseiler) {
    const mensei = asRecord(menseiRaw)
    const menseiAd = name(mensei, MENSEI_NAME)
    const bolgeler = firstArray(mensei, BOLGE_ARR)

    if (bolgeler.length === 0) {
      pushRow(
        menseiAd,
        name(mensei, BOLGE_NAME),
        name(mensei, MINTIKA_NAME),
        name(mensei, ALIM_NAME),
        mensei,
      )
      continue
    }

    for (const bolgeRaw of bolgeler) {
      const bolge = asRecord(bolgeRaw)
      const bolgeAd = name(bolge, BOLGE_NAME)
      const mintikalar = firstArray(bolge, MINTIKA_ARR)

      if (mintikalar.length === 0) {
        pushRow(menseiAd, bolgeAd, name(bolge, MINTIKA_NAME), name(bolge, ALIM_NAME), bolge)
        continue
      }

      for (const mintikaRaw of mintikalar) {
        const mintika = asRecord(mintikaRaw)
        const mintikaAd = name(mintika, MINTIKA_NAME)
        const alimNoktalari = firstArray(mintika, ALIM_ARR)

        if (alimNoktalari.length === 0) {
          pushRow(menseiAd, bolgeAd, mintikaAd, name(mintika, ALIM_NAME), mintika)
          continue
        }

        for (const alimRaw of alimNoktalari) {
          const alim = asRecord(alimRaw)
          pushRow(menseiAd, bolgeAd, mintikaAd, name(alim, ALIM_NAME), alim)
        }
      }
    }
  }

  return {
    rows,
    genelToplam: toTotals(asRecord(pick(root, ['genelToplam', 'GenelToplam']))),
  }
}
