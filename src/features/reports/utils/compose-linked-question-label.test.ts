import { describe, expect, it } from 'vitest'
import { composeLinkedQuestionLabel } from './compose-linked-question-label'

describe('composeLinkedQuestionLabel', () => {
  it('does not repeat an option name that is already in the question', () => {
    expect(composeLinkedQuestionLabel('13-24-12 kullanım miktarı? (da/kg)', '13-24-12')).toBe(
      '13-24-12 kullanım miktarı? (da/kg)',
    )
  })

  it('prefixes generic linked questions with the option', () => {
    expect(composeLinkedQuestionLabel('Bireylerin bu koşula erişme imkanı var mı?', 'Tuvalet')).toBe(
      'Tuvalet — Bireylerin bu koşula erişme imkanı var mı?',
    )
  })
})
