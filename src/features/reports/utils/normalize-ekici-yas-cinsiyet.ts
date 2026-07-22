import type {
  AgeBandValue,
  EkiciYasCinsiyetReport,
  EkiciYasCinsiyetRow,
  EkiciYasCinsiyetTotals,
} from '../types/ekici-yas-cinsiyet.types'

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

function toBand(value: unknown): AgeBandValue {
  const raw = asRecord(value)
  return {
    erkek: num(pick(raw, ['erkek', 'Erkek', 'erkekSayisi'])),
    kadin: num(pick(raw, ['kadin', 'Kadin', 'kadın', 'kadinSayisi'])),
    toplam: num(pick(raw, ['toplam', 'Toplam'])),
  }
}

function toTotals(node: Raw): EkiciYasCinsiyetTotals {
  // Sayılar seviyeye göre `counts` (alım noktası) veya `totals` (üst kırılım)
  // sarmalayıcısının içinde gelir; yoksa düğümün kendisinden okunur (ör. genelToplam).
  const c = asRecord(pick(node, ['counts', 'Counts', 'totals', 'Totals']) ?? node)
  return {
    band18_30: toBand(pick(c, ['band18_30', 'Band18_30', 'band1830', 'yas18_30'])),
    band31_40: toBand(pick(c, ['band31_40', 'Band31_40', 'band3140', 'yas31_40'])),
    band41_50: toBand(pick(c, ['band41_50', 'Band41_50', 'band4150', 'yas41_50'])),
    band50Plus: toBand(pick(c, ['band50Plus', 'Band50Plus', 'band50plus', 'yas50Plus'])),
    sozlesmeliEkiciToplam: num(
      pick(c, ['sozlesmeliEkiciToplam', 'SozlesmeliEkiciToplam', 'genelToplam', 'toplam']),
    ),
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

export function normalizeEkiciYasCinsiyetReport(raw: unknown): EkiciYasCinsiyetReport {
  const root = asRecord(raw)
  const menseiler = firstArray(root, ['menseiler', 'Menseiler'])
  const rows: EkiciYasCinsiyetRow[] = []

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

    // Düz (flat) yapı: her kayıt tüm seviyeleri tek nesnede taşıyor
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
