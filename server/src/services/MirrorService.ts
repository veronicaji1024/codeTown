import type { AgentType } from '@codetown/shared'

interface Bubble {
  agentId: string
  agentType: AgentType
  content: string
  isComplete: boolean
}

/**
 * MirrorService — 管理 Mirror 面板的气泡生命周期
 * 通过 AgentRunner 的 onMirrorChunk 回调通信，不独立持有 WebSocket 引用
 */
export class MirrorService {
  private bubbles = new Map<string, Bubble>()

  startBubble(agentId: string, agentType: AgentType): void {
    this.bubbles.set(agentId, {
      agentId,
      agentType,
      content: '',
      isComplete: false,
    })
  }

  appendChunk(agentId: string, chunk: string): void {
    const bubble = this.bubbles.get(agentId)
    if (bubble) {
      bubble.content += chunk
    }
  }

  completeBubble(agentId: string): void {
    const bubble = this.bubbles.get(agentId)
    if (bubble) {
      bubble.isComplete = true
    }
  }

  getBubble(agentId: string): Bubble | undefined {
    return this.bubbles.get(agentId)
  }

  clear(): void {
    this.bubbles.clear()
  }
}
