import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let client: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (client) return client

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to use the Habits+ database.')
  }

  client = drizzle(neon(databaseUrl), { schema })
  return client
}
