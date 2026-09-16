import { describe, expect, it } from 'vitest'
import { isGeneratable } from './parent-report-row'

const student = {
  id: 'student-1',
  name: 'Ayu',
  nisn: '123',
  observedDays: 2,
}

describe('isGeneratable', () => {
  it('allows an empty report with observations', () => {
    expect(isGeneratable(student, { kind: 'empty' })).toBe(true)
  })

  it('rejects an empty report without observations', () => {
    expect(
      isGeneratable({ ...student, observedDays: 0 }, { kind: 'empty' }),
    ).toBe(false)
  })

  it('rejects reports that already have a draft', () => {
    expect(
      isGeneratable(student, { kind: 'draft', content: 'Draf laporan' }),
    ).toBe(false)
  })
})
