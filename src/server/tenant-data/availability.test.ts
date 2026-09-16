import { describe, expect, it } from 'vitest'
import { observationMonthRange } from './availability'

describe('observationMonthRange', () => {
  it('scopes a regular month to its next month boundary', () => {
    expect(observationMonthRange('2026-09')).toEqual({
      start: '2026-09-01',
      end: '2026-10-01',
    })
  })

  it('rolls December into January of the next year', () => {
    expect(observationMonthRange('2026-12')).toEqual({
      start: '2026-12-01',
      end: '2027-01-01',
    })
  })
})
