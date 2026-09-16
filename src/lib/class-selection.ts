export function resolveSelectedClassId(
  classes: ReadonlyArray<{ id: string }>,
  requestedClassId: string | undefined,
): string {
  const requested = classes.find((item) => item.id === requestedClassId)?.id
  if (requested) return requested

  return classes.length === 1 ? classes[0].id : ''
}
