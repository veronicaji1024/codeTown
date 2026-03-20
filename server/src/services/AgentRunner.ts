import Anthropic from '@anthropic-ai/sdk'
import { MODEL_CONFIG } from '../utils/modelConfig'

export interface RunAgentOptions {
  systemPrompt: string
  userMessage: string
  apiKey: string
  onChunk: (chunk: string) => void
  onMirrorChunk: (chunk: string, isComplete: boolean) => void
}

/**
 * AgentRunner — 封装单次 Claude API 流式调用
 * 永远不 log apiKey
 */
export async function runAgent({
  systemPrompt,
  userMessage,
  apiKey,
  onChunk,
  onMirrorChunk,
}: RunAgentOptions): Promise<string> {
  const baseURL = MODEL_CONFIG.apiEndpoint.replace(/\/v1\/messages$/, '')
  console.log('[AgentRunner] baseURL:', baseURL)
  console.log('[AgentRunner] model:', MODEL_CONFIG.model)
  console.log('[AgentRunner] apiKey prefix:', apiKey?.slice(0, 6) + '...')

  const client = new Anthropic({
    apiKey,
    baseURL,
  })

  let fullContent = ''

  console.log('[AgentRunner] Starting stream...')
  const stream = client.messages.stream({
    model: MODEL_CONFIG.model,
    max_tokens: MODEL_CONFIG.maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const text = event.delta.text
      fullContent += text
      onChunk(text)
      onMirrorChunk(text, false)
    }
  }

  onMirrorChunk('', true)
  return fullContent
}
