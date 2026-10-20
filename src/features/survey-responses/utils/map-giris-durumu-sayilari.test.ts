import { describe, expect, it } from 'vitest'
import { mapAnketGirisDurumuSayilari } from './map-giris-durumu-sayilari'

describe('mapAnketGirisDurumuSayilari', () => {
  it('maps counts and totals them for all ekiciler', () => {
    expect(
      mapAnketGirisDurumuSayilari({
        tamamlananAnketSayisi: 26,
        yarimKalanAnketSayisi: 1558,
        girisYokSayisi: 4677,
      }),
    ).toEqual({
      tamamlananAnketSayisi: 26,
      yarimKalanAnketSayisi: 1558,
      girisYokSayisi: 4677,
      toplamEkiciSayisi: 6261,
      menseiEkiciSayisi: null,
      bolgeEkiciSayisi: null,
      mintikaEkiciSayisi: null,
      alimNoktasiEkiciSayisi: null,
      koyEkiciSayisi: null,
    })
  })

  it('reads PascalCase fields', () => {
    expect(
      mapAnketGirisDurumuSayilari({
        TamamlananAnketSayisi: 1,
        YarimKalanAnketSayisi: 2,
        GirisYokSayisi: 3,
      }).toplamEkiciSayisi,
    ).toBe(6)
  })

  it('prefers ekiciSayisi and maps per-filter counts', () => {
    expect(
      mapAnketGirisDurumuSayilari({
        tamamlananAnketSayisi: 10,
        yarimKalanAnketSayisi: 4,
        girisYokSayisi: 6,
        ekiciSayisi: 20,
        menseiEkiciSayisi: null,
        bolgeEkiciSayisi: 80,
        mintikaEkiciSayisi: 25,
        alimNoktasiEkiciSayisi: null,
        koyEkiciSayisi: 0,
      }),
    ).toEqual({
      tamamlananAnketSayisi: 10,
      yarimKalanAnketSayisi: 4,
      girisYokSayisi: 6,
      toplamEkiciSayisi: 20,
      menseiEkiciSayisi: null,
      bolgeEkiciSayisi: 80,
      mintikaEkiciSayisi: 25,
      alimNoktasiEkiciSayisi: null,
      koyEkiciSayisi: 0,
    })
  })
})
