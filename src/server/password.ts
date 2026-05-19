export async function hashPassword(password: string) {
  const { randomBytes, scryptSync } = await import('node:crypto')
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const { scryptSync, timingSafeEqual } = await import('node:crypto')
  const [algorithm, salt, hash] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false

  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  )
}
