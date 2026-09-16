export type PeriodAvailability = {
  selectedHasData: boolean
  latestPeriod: string | null
  previousPeriod: string | null
  recentPeriods: Array<string>
}

export function buildPeriodAvailability({
  selectedPeriod,
  selectedHasData,
  populatedPeriods,
}: {
  selectedPeriod: string
  selectedHasData: boolean
  populatedPeriods: Iterable<string>
}): PeriodAvailability {
  const recentPeriods = [...new Set(populatedPeriods)].sort((a, b) =>
    b.localeCompare(a),
  )

  return {
    selectedHasData,
    latestPeriod: recentPeriods[0] ?? null,
    previousPeriod:
      recentPeriods.find((period) => period < selectedPeriod) ?? null,
    recentPeriods,
  }
}
