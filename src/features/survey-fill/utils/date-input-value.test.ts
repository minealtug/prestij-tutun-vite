import { describe, expect, it } from 'vitest'
import {
  formatDisplayDate,
  formatTypedDisplayDate,
  parseDateValue,
  toDateInputValue,
  toDateOnlyApiValue,
} from './date-input-value'

describe('toDateInputValue', () => {
  it('keeps API ISO dates', () => {
    expect(toDateInputValue('1955-08-20')).toBe('1955-08-20')
    expect(toDateInputValue('1955-08-20T00:00:00')).toBe('1955-08-20')
  })

  it('parses GG.AA.YYYY display values', () => {
    expect(toDateInputValue('20.08.1955')).toBe('1955-08-20')
  })

  it('rejects invalid dates', () => {
    expect(toDateInputValue('32.13.2020')).toBe('')
    expect(toDateInputValue('')).toBe('')
  })
})

describe('toDateOnlyApiValue', () => {
  it('saves the API YYYY-MM-DD value', () => {
    expect(toDateOnlyApiValue('20.08.1955')).toBe('1955-08-20')
    expect(toDateOnlyApiValue('1955-08-20')).toBe('1955-08-20')
    expect(toDateOnlyApiValue('')).toBeNull()
  })
})

describe('formatDisplayDate', () => {
  it('shows GG.AA.YYYY', () => {
    expect(formatDisplayDate('1955-08-20')).toBe('20.08.1955')
    expect(formatDisplayDate(new Date(1955, 7, 20))).toBe('20.08.1955')
  })
})

describe('formatTypedDisplayDate', () => {
  it('inserts dots while typing digits', () => {
    expect(formatTypedDisplayDate('0')).toBe('0')
    expect(formatTypedDisplayDate('01')).toBe('01')
    expect(formatTypedDisplayDate('010')).toBe('01.0')
    expect(formatTypedDisplayDate('0102')).toBe('01.02')
    expect(formatTypedDisplayDate('01021')).toBe('01.02.1')
    expect(formatTypedDisplayDate('01021990')).toBe('01.02.1990')
  })

  it('keeps already dotted values and strips extra characters', () => {
    expect(formatTypedDisplayDate('01.02.1990')).toBe('01.02.1990')
    expect(formatTypedDisplayDate('01-02-1990')).toBe('01.02.1990')
    expect(formatTypedDisplayDate('01021990111')).toBe('01.02.1990')
  })

  it('shows stored ISO dates as GG.AA.YYYY', () => {
    expect(formatTypedDisplayDate('1990-02-01')).toBe('01.02.1990')
  })
})

describe('parseDateValue', () => {
  it('parses both stored and displayed formats', () => {
    expect(parseDateValue('1955-08-20')?.getDate()).toBe(20)
    expect(parseDateValue('20.08.1955')?.getMonth()).toBe(7)
  })
})
