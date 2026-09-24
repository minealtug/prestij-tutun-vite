import { describe, expect, it } from 'vitest'
import type { SoruCevapDisplay } from '../types/survey-response.types'
import {
  collectLabeledDescendants,
  enrichMultiSelectAnswers,
  filterDuplicateKontratSahibiAnswers,
  formatLinkedAnswerLabel,
} from './format-linked-answer-label'

function node(
  partial: Pick<SoruCevapDisplay, 'soruId' | 'soruMetni'> & Partial<SoruCevapDisplay>,
): SoruCevapDisplay {
  return {
    sira: partial.soruId,
    yanitlandi: true,
    cevapMetni: 'Evet',
    bagliSoru: true,
    children: [],
    ...partial,
  }
}

describe('filterDuplicateKontratSahibiAnswers', () => {
  it('removes contract-owner fields that already exist on ekici', () => {
    const tree = [
      node({
        soruId: 1,
        soruMetni: 'Üretimi yapan?',
        bagliSoru: false,
        children: [
          node({ soruId: 2, soruMetni: 'Kontrat sahibi cinsiyet?' }),
          node({ soruId: 3, soruMetni: 'Kontrat sahibi doğum tarihi?' }),
          node({ soruId: 4, soruMetni: 'Kontrat sahibi ad-soyad?' }),
        ],
      }),
    ]

    expect(filterDuplicateKontratSahibiAnswers(tree)[0]?.children).toEqual([])
  })
})

describe('formatLinkedAnswerLabel', () => {
  it('prefixes repeating linked questions with the option name', () => {
    expect(
      formatLinkedAnswerLabel(
        node({
          soruId: 11,
          soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
          bagliAltSecenekId: 21,
        }),
        new Map(),
        new Map([[21, 'Tuvalet']]),
      ),
    ).toBe('Tuvalet — Bireylerin bu koşula erişme imkanı var mı?')
  })
})

describe('enrichMultiSelectAnswers', () => {
  it('joins all selected options for a multi-select parent', () => {
    const tree = [
      node({
        soruId: 10,
        soruMetni: 'Üretici yaşam koşulları?',
        bagliSoru: false,
        cevapMetni: 'Temizlik (Hijyen) Suyu',
        children: [
          node({
            soruId: 11,
            soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
            bagliAltSecenekId: 21,
          }),
          node({
            soruId: 12,
            soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
            bagliAltSecenekId: 22,
          }),
          node({
            soruId: 13,
            soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
            bagliAltSecenekId: 23,
          }),
        ],
      }),
    ]

    const enriched = enrichMultiSelectAnswers(
      tree,
      new Map(),
      new Map([
        [21, 'İçme Suyu'],
        [22, 'Elektrik'],
        [23, 'Temizlik (Hijyen) Suyu'],
      ]),
    )

    expect(enriched[0]?.cevapMetni).toBe('İçme Suyu, Elektrik, Temizlik (Hijyen) Suyu')
  })
})

describe('collectLabeledDescendants', () => {
  it('keeps identical child questions distinguishable', () => {
    const root = node({
      soruId: 10,
      soruMetni: 'Üretici yaşam koşulları?',
      bagliSoru: false,
      children: [
        node({
          soruId: 11,
          soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
          bagliAltSecenekId: 21,
        }),
        node({
          soruId: 12,
          soruMetni: 'Bireylerin bu koşula erişme imkanı var mı?',
          bagliAltSecenekId: 22,
        }),
      ],
    })

    expect(
      collectLabeledDescendants(root, new Map(), new Map([
        [21, 'Tuvalet'],
        [22, 'Duş'],
      ])).map((item) => item.label),
    ).toEqual([
      'Tuvalet — Bireylerin bu koşula erişme imkanı var mı?',
      'Duş — Bireylerin bu koşula erişme imkanı var mı?',
    ])
  })
})
