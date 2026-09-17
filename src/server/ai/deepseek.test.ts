import { afterEach, describe, expect, it, vi } from 'vitest'
import { createChatCompletion, parseChatCompletionResponse } from './deepseek'

const usage = {
  prompt_tokens: 636,
  completion_tokens: 500,
  prompt_tokens_details: { cached_tokens: 128 },
}

function responseWith({
  content,
  finishReason,
}: {
  content: string
  finishReason: 'stop' | 'length'
}) {
  return {
    choices: [
      {
        finish_reason: finishReason,
        message: { content },
      },
    ],
    usage,
  }
}

describe('DeepSeek response boundary', () => {
  it('returns trimmed content and token usage', () => {
    expect(
      parseChatCompletionResponse(
        responseWith({ content: '  Ringkasan siswa.  ', finishReason: 'stop' }),
      ),
    ).toEqual({
      kind: 'success',
      content: 'Ringkasan siswa.',
      usage: {
        promptTokens: 636,
        cachedTokens: 128,
        completionTokens: 500,
      },
    })
  })

  it('preserves usage when the output limit leaves content empty', () => {
    expect(
      parseChatCompletionResponse(
        responseWith({ content: '', finishReason: 'length' }),
      ),
    ).toEqual({
      kind: 'failure',
      error: 'Batas token DeepSeek tercapai sebelum teks ringkasan dibuat.',
      usage: {
        promptTokens: 636,
        cachedTokens: 128,
        completionTokens: 500,
      },
    })
  })

  it('rejects an unrecognized payload', () => {
    expect(parseChatCompletionResponse({ choices: [] })).toMatchObject({
      kind: 'failure',
      usage: { promptTokens: 0, cachedTokens: 0, completionTokens: 0 },
    })
  })
})

describe('DeepSeek request', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses the current model with thinking disabled', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-key')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify(
            responseWith({ content: 'Ringkasan.', finishReason: 'stop' }),
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createChatCompletion([{ role: 'user', content: 'Buat ringkasan.' }]),
    ).resolves.toMatchObject({ kind: 'success' })

    const init = fetchMock.mock.calls[0]?.[1]
    if (!init?.body) throw new Error('Missing DeepSeek request body')
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'deepseek-flash',
      thinking: { type: 'disabled' },
      max_tokens: 500,
      stream: false,
    })
  })
})
