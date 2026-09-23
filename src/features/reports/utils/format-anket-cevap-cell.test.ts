import { describe, expect, it } from 'vitest'
import {
  formatAnketCevapCell,
  isBakmaklaYukumluKisiSayisiColumn,
} from './format-anket-cevap-cell'

describe('isBakmaklaYukumluKisiSayisiColumn', () => {
  it('matches the dependents question header', () => {
    expect(isBakmaklaYukumluKisiSayisiColumn('Bakmakla yükümlü olduğu kişi sayısı')).toBe(true)
    expect(isBakmaklaYukumluKisiSayisiColumn('Sözleşme Kg')).toBe(false)
  })
})

describe('formatAnketCevapCell', () => {
  const header = 'Bakmakla yükümlü olduğu kişi sayısı'

  it('leaves unanswered dependents count blank instead of 0', () => {
    expect(formatAnketCevapCell(header, '')).toBe('')
    expect(formatAnketCevapCell(header, null)).toBe('')
    expect(formatAnketCevapCell(header, '0')).toBe('')
    expect(formatAnketCevapCell(header, 0)).toBe('')
  })

  it('keeps a real positive count', () => {
    expect(formatAnketCevapCell(header, '3')).toBe('3')
  })

  it('keeps 0 for unrelated numeric answers', () => {
    expect(formatAnketCevapCell('Sözleşme Kg', '0')).toBe('0')
    expect(formatAnketCevapCell('Dönüm', 0)).toBe('0')
  })
})
