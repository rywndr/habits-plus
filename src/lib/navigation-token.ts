export function settleLatestNavigation(
  token: number,
  currentToken: number,
  settle: () => void,
) {
  if (token !== currentToken) return false
  settle()
  return true
}
