import { z } from 'zod'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

export const DEEPSEEK_MODEL = 'deepseek-flash'

export type DeepseekUsage = {
  promptTokens: number
  cachedTokens: number
  completionTokens: number
}

export function emptyUsage(): DeepseekUsage {
  return { promptTokens: 0, cachedTokens: 0, completionTokens: 0 }
}

export function addUsage(a: DeepseekUsage, b: DeepseekUsage): DeepseekUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    completionTokens: a.completionTokens + b.completionTokens,
  }
}

type ChatMessage = {
  role: 'system' | 'user'
  content: string
}

const tokenCount = z.number().int().nonnegative()

const deepseekResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        // Keep this open to new provider reasons. Known reasons get tailored
        // messages below; unknown ones still retain usage for diagnosis.
        finish_reason: z.string(),
        message: z.object({
          content: z.string().nullable(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: tokenCount,
      completion_tokens: tokenCount,
      prompt_cache_hit_tokens: tokenCount.optional(),
      prompt_tokens_details: z
        .object({ cached_tokens: tokenCount.optional() })
        .optional(),
    })
    .optional(),
})

export type ChatCompletionResult =
  | { kind: 'success'; content: string; usage: DeepseekUsage }
  | { kind: 'failure'; error: string; usage: DeepseekUsage }

function usageFromResponse(
  usage: z.infer<typeof deepseekResponseSchema>['usage'],
): DeepseekUsage {
  return {
    promptTokens: usage?.prompt_tokens ?? 0,
    cachedTokens:
      usage?.prompt_cache_hit_tokens ??
      usage?.prompt_tokens_details?.cached_tokens ??
      0,
    completionTokens: usage?.completion_tokens ?? 0,
  }
}

export function parseChatCompletionResponse(
  payload: unknown,
): ChatCompletionResult {
  const parsed = deepseekResponseSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      kind: 'failure',
      error: 'DeepSeek API mengembalikan format respons yang tidak dikenali.',
      usage: emptyUsage(),
    }
  }

  const choice = parsed.data.choices[0]
  const usage = usageFromResponse(parsed.data.usage)
  const content = choice.message.content?.trim()
  if (content) return { kind: 'success', content, usage }

  const error =
    choice.finish_reason === 'length'
      ? 'Batas token DeepSeek tercapai sebelum teks ringkasan dibuat.'
      : choice.finish_reason === 'content_filter'
        ? 'DeepSeek tidak membuat ringkasan karena filter konten.'
        : choice.finish_reason === 'insufficient_system_resource' ||
            choice.finish_reason === 'aborted'
          ? 'DeepSeek menghentikan pembuatan ringkasan. Coba lagi.'
          : 'DeepSeek API tidak mengembalikan teks ringkasan.'

  return { kind: 'failure', error, usage }
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
): Promise<ChatCompletionResult> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      thinking: { type: 'disabled' },
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

  const payload: unknown = await response.json().catch(() => undefined)
  return parseChatCompletionResponse(payload)
}
