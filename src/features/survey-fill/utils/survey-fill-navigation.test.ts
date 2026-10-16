import { describe, expect, it } from 'vitest'
import { buildSurveyFillDeepLink, parseSurveyFillDeepLink } from './survey-fill-navigation'

describe('survey fill own-answer edit link', () => {
  it('keeps kendiCevap so Cevapladığım Anketler edits hit /cevap/kendi', () => {
    const href = buildSurveyFillDeepLink({
      baslikId: 8,
      sablonId: 2,
      ekiciId: 'E-1',
      mintikaId: 4,
      duzenle: true,
      kendiCevap: true,
    })

    expect(href).toContain('duzenle=1')
    expect(href).toContain('kendi=1')

    const parsed = parseSurveyFillDeepLink(new URLSearchParams(href.split('?')[1]))
    expect(parsed?.kendiCevap).toBe(true)
    expect(parsed?.duzenle).toBe(true)
  })
})
