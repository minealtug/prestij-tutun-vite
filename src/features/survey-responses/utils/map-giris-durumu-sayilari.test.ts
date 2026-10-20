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
})
