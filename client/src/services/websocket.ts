import type { WsClientMessage, WsServerMessage } from '@codetown/shared'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3000

export class WebSocketService {
  private ws: WebSocket | null = null
  private intentionalClose = false
  private retryCount = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private token: string | null = null

  /** 最近一次连接错误信息 */
  lastError: string | null = null

  // 事件回调（供组件注册）
  onMessage: (msg: WsServerMessage) => void = () => {}
  onOpen: () => void = () => {}
  onClose: (code: number, reason: string) => void = () => {}
  onError: (err: Event, detail: string) => void = () => {}

  connect(token: string): void {
    // 幂等：相同 token 且已在连接/已连接 → 跳过，仅在已 OPEN 时重新触发 onOpen
    if (this.token === token && this.ws != null) {
      const rs = this.ws.readyState
      if (rs === WebSocket.CONNECTING || rs === WebSocket.OPEN) {
        console.log('[WS] connect() skipped — already', rs === WebSocket.OPEN ? 'OPEN' : 'CONNECTING')
        if (rs === WebSocket.OPEN) {
          this.onOpen()
        }
        return
      }
    }
    console.log('[WS] connect() — creating new connection')

    this.token = token
    this.retryCount = 0
    this.clearRetryTimer()

    // 卸载旧连接的事件处理器，防止旧 onclose 异步触发时误报错误
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.close(1000, 'reconnecting')
      this.ws = null
    }

    this.intentionalClose = false
    this.createConnection()
  }

  disconnect(): void {
    this.intentionalClose = true
    this.clearRetryTimer()
    this.token = null
    if (this.ws) {
      // 必须卸载事件处理器，防止 Strict Mode 下旧连接的异步回调触发误报
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.close(1000, 'client_disconnect')
      this.ws = null
    }
  }

  send(msg: WsClientMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
      return true
    }
    return false
  }

  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  // ===== 内部实现 =====

  private createConnection(): void {
    if (!this.token) return

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
    this.ws = new WebSocket(`${wsUrl}/ws?token=${this.token}`)

    this.ws.onopen = () => {
      console.log('[WS] onopen — connected')
      this.retryCount = 0
      this.lastError = null
      this.onOpen()
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsServerMessage
        this.onMessage(msg)
      } catch {
        // 忽略非法 JSON
      }
    }

    this.ws.onclose = (event) => {
      console.log(`[WS] onclose — code: ${event.code}, reason: "${event.reason}", intentional: ${this.intentionalClose}`)
      this.ws = null
      const reason = event.reason || `WebSocket 关闭 (code: ${event.code})`
      if (!this.intentionalClose) {
        this.lastError = reason
      }
      this.onClose(event.code, reason)

      if (!this.intentionalClose) {
        this.scheduleRetry()
      }
    }

    this.ws.onerror = (err) => {
      console.log('[WS] onerror', err)
      const detail = '无法连接到服务器'
      this.lastError = detail
      this.onError(err, detail)
    }
  }

  private scheduleRetry(): void {
    if (this.retryCount >= MAX_RETRIES) return

    this.retryCount++
    this.retryTimer = setTimeout(() => {
      this.createConnection()
    }, RETRY_DELAY_MS)
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }
}

export const wsService = new WebSocketService()
