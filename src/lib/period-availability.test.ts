import { describe, expect, it } from 'vitest'
import { buildPeriodAvailability } from './period-availability'

describe('buildPeriodAvailability', () => {
  it('sorts and deduplicates populated periods', () => {
    expect(
      buildPeriodAvailability({
        selectedPeriod: '2026-09-16',
        selectedHasData: false,
        populatedPeriods: ['2026-08-20', '2026-09-10', '2026-09-10'],
      }),
    ).toEqual({
      selectedHasData: false,
      latestPeriod: '2026-09-10',
      previousPeriod: '2026-09-10',
      recentPeriods: ['2026-09-10', '2026-08-20'],
    })
  })

  it('returns null periods when no data exists', () => {
    expect(
      buildPeriodAvailability({
        selectedPeriod: '2026-09',
        selectedHasData: false,
        populatedPeriods: [],
      }),
    ).toEqual({
      selectedHasData: false,
      latestPeriod: null,
      previousPeriod: null,
      recentPeriods: [],
    })
  })
})
