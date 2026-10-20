import { describe, expect, it } from 'vitest'
import type { AnketGirisDurumuSayilari } from '@/features/survey-responses/types/survey-response.types'
import { buildCografiEkiciFillRows, getCografiFillRowLabels } from './build-cografi-fill-rows'

const COUNTS: AnketGirisDurumuSayilari = {
  tamamlananAnketSayisi: 10,
  yarimKalanAnketSayisi: 4,
  girisYokSayisi: 6,
  toplamEkiciSayisi: 20,
  menseiEkiciSayisi: null,
  bolgeEkiciSayisi: 80,
  mintikaEkiciSayisi: 25,
  alimNoktasiEkiciSayisi: null,
  koyEkiciSayisi: 0,
}

describe('buildCografiEkiciFillRows', () => {
  it('keeps only the smallest selected geographic breakdown as a single bar', () => {
    expect(
      buildCografiEkiciFillRows(COUNTS, {
        bolgeAdi: 'Ege',
        mintikaAdi: 'Akhisar',
        koyAdi: 'Örnek',
      }),
    ).toEqual([
      {
        key: 'koy',
        label: 'Örnek',
        totalEkici: 20,
        completedEkici: 10,
        partialEkici: 4,
        untouchedEkici: 6,
      },
    ])
  })

  it('falls back to the next selected level when a smaller filter is empty', () => {
    expect(
      buildCografiEkiciFillRows(
        { ...COUNTS, koyEkiciSayisi: null, alimNoktasiEkiciSayisi: null },
        { bolgeAdi: 'Ege', mintikaAdi: 'Akhisar' },
      ),
    ).toEqual([
      {
        key: 'mintika',
        label: 'Akhisar',
        totalEkici: 20,
        completedEkici: 10,
        partialEkici: 4,
        untouchedEkici: 6,
      },
    ])
  })

  it('returns no columns when counts are missing', () => {
    expect(buildCografiEkiciFillRows(undefined)).toEqual([])
  })
})

describe('getCografiFillRowLabels', () => {
  it('resolves selected filter names', () => {
    expect(
      getCografiFillRowLabels(
        {
          menseiler: [{ id: 1, adi: 'Ege' }],
          bolgeler: [{ id: 2, adi: 'Manisa', menseiId: 1 }],
          mintikalar: [{ id: 3, adi: 'Akhisar', bolgeId: 2 }],
          alimNoktalari: [{ id: 4, adi: 'Merkez', mintikaId: 3 }],
          koyler: [{ id: 5, adi: 'Örnek', alimNoktasiId: 4 }],
        },
        { menseiId: 1, mintikaId: 3 },
      ),
    ).toEqual({
      menseiAdi: 'Ege',
      bolgeAdi: undefined,
      mintikaAdi: 'Akhisar',
      alimNoktasiAdi: undefined,
      koyAdi: undefined,
    })
  })
})
