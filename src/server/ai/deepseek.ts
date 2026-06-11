const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

export const DEEPSEEK_MODEL = 'deepseek-v4-flash'

const PRICE_INPUT_CACHE_MISS_PER_M = 0.14
const PRICE_INPUT_CACHE_HIT_PER_M = 0.0028
const PRICE_OUTPUT_PER_M = 0.28

export type DeepseekUsage = {
  promptTokens: number
  cachedTokens: number
  completionTokens: number
  costUsd: number
}

export function emptyUsage(): DeepseekUsage {
  return { promptTokens: 0, cachedTokens: 0, completionTokens: 0, costUsd: 0 }
}

export function addUsage(a: DeepseekUsage, b: DeepseekUsage): DeepseekUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    costUsd: a.costUsd + b.costUsd,
  }
}

type ChatMessage = {
  role: 'system' | 'user'
  content: string
}

type DeepseekResponse = {
  choices?: Array<{ message?: { content?: string } }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    prompt_cache_hit_tokens?: number
    prompt_cache_miss_tokens?: number
  }
}

function getApiKey() {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) {
    throw new Error('No DEEPSEEK_API_KEY')
  }
  return key
}

export async function createChatCompletion(
  messages: Array<ChatMessage>,
): Promise<{ content: string; usage: DeepseekUsage }> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 1.0,
      max_tokens: 500,
      stream: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `DeepSeek API gagal (${response.status}): ${body.slice(0, 300)}`,
    )
  }

  const data = (await response.json()) as DeepseekResponse
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('DeepSeek API tidak mengembalikan teks ringkasan.')
  }

  const promptTokens = data.usage?.prompt_tokens ?? 0
  const completionTokens = data.usage?.completion_tokens ?? 0
  const cachedTokens = data.usage?.prompt_cache_hit_tokens ?? 0
  const missTokens =
    data.usage?.prompt_cache_miss_tokens ?? promptTokens - cachedTokens

  const costUsd =
    (missTokens * PRICE_INPUT_CACHE_MISS_PER_M +
      cachedTokens * PRICE_INPUT_CACHE_HIT_PER_M +
      completionTokens * PRICE_OUTPUT_PER_M) /
    1_000_000

  return {
    content,
    usage: { promptTokens, cachedTokens, completionTokens, costUsd },
  }
}
