import { describe, expect, it } from 'vitest'
import { getSelectedGeneratableIds, isGeneratable } from './parent-report-row'

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

describe('getSelectedGeneratableIds', () => {
  it('drops selected IDs that are no longer eligible', () => {
    const rows = [
      { student, state: { kind: 'empty' } },
      {
        student: { ...student, id: 'student-2', name: 'Bima' },
        state: { kind: 'draft', content: 'Draf laporan' },
      },
    ] satisfies Parameters<typeof getSelectedGeneratableIds>[0]

    expect(
      getSelectedGeneratableIds(
        rows,
        new Set(['student-1', 'student-2', 'student-from-old-context']),
      ),
    ).toEqual(['student-1'])
  })
})
