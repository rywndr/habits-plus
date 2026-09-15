export function resolveSelectedClassId(
  classes: ReadonlyArray<{ id: string }>,
  requestedClassId: string | undefined,
): string {
  return classes.find((item) => item.id === requestedClassId)?.id ?? ''
}
