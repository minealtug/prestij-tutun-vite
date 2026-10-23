import { describe, expect, it } from 'vitest'
import { mapYarimFormUyarisi } from './map-yarim-form-uyarisi'

describe('mapYarimFormUyarisi', () => {
  it('reads the payload including missing questions', () => {
    const mapped = mapYarimFormUyarisi({
      adet: 1,
      kayitlar: [
        {
          ekiciId: 'e1',
          ekiciAd: 'ÇİĞDEM',
          ekiciSoyad: 'ATMAZ',
          kullaniciAdi: 'Azmi Gökhan Erciyas',
          anketAdi: 'STP ANKETİ',
          mintikaAdi: 'ACIPAYAM',
          baslikId: 4,
          sablonId: 9,
          sonIslemTarihi: '2026-10-12T13:50:00',
          beklemeGunu: 11,
          yanitlananSoruSayisi: 3,
          yanitlanmayanSoruSayisi: 2,
          eksikSorular: ['Kaç dönüm?', { soruMetni: 'Sulama var mı?' }],
          eskiyen: true,
        },
      ],
    })

    expect(mapped.adet).toBe(1)
    expect(mapped.kayitlar).toEqual([
      expect.objectContaining({
        ekiciId: 'e1',
        anketAdi: 'STP ANKETİ',
        mintikaAdi: 'ACIPAYAM',
        beklemeGunu: 11,
        eksikSorular: ['Kaç dönüm?', 'Sulama var mı?'],
        eskiyen: true,
      }),
    ])
  })

  it('accepts PascalCase and a bare array', () => {
    const mapped = mapYarimFormUyarisi([
      {
        EkiciId: 'e2',
        SablonId: 3,
        BeklemeGunu: 2,
      },
    ])

    expect(mapped.adet).toBe(0)
    expect(mapped.kayitlar[0]?.eskiyen).toBe(false)
    expect(mapped.kayitlar[0]?.id).toBe('e2|0|3')
  })

  it('does not infer eskiyen from beklemeGunu when the flag is missing', () => {
    const mapped = mapYarimFormUyarisi({
      Adet: 1,
      Kayitlar: [
        {
          EkiciId: 'e1',
          SablonId: 9,
          BeklemeGunu: 11,
        },
      ],
    })

    expect(mapped.adet).toBe(1)
    expect(mapped.kayitlar[0]?.eskiyen).toBe(false)
    expect(mapped.kayitlar[0]?.beklemeGunu).toBe(11)
  })
})
