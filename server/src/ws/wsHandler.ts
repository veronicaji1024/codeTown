import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import type { IncomingMessage } from 'node:http'
import { URL } from 'node:url'
import { supabase } from '../lib/supabase'
import { orchestrate, type OrchestratorCallbacks } from '../services/Orchestrator'
import type { WsClientMessage, WsServerMessage } from '@codetown/shared'

// ===== 连接状态 =====

interface ConnectionState {
  ws: WebSocket
  userId: string
  stopped: boolean
  checkpointResolvers: Map<string, {
    resolve: (value: { action: 'approve' | 'modify'; note?: string }) => void
    reject: (reason: Error) => void
  }>
}

const connections = new Map<string, ConnectionState>()

// ===== 公开接口 =====

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    // 1. 提取 token
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'missing_token')
      return
    }

    // 2. 验证 token
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      ws.close(4001, 'invalid_token')
      return
    }

    const userId = data.user.id

    // 3. 连接唯一性 — 关闭同用户旧连接
    const existing = connections.get(userId)
    if (existing) {
      cleanupConnection(existing, 'new_connection_replaced')
      existing.ws.close(4000, 'replaced_by_new_connection')
    }

    // 4. 注册新连接
    const state: ConnectionState = {
      ws,
      userId,
      stopped: false,
      checkpointResolvers: new Map(),
    }
    connections.set(userId, state)

    // 5. 消息处理
    ws.on('message', (raw) => {
      let msg: WsClientMessage
      try {
        msg = JSON.parse(String(raw))
      } catch {
        return // 忽略非法 JSON
      }
      handleMessage(state, msg)
    })

    // 6. 断开清理
    ws.on('close', () => {
      // 仅当 Map 中仍是当前连接时才清理（避免被替换后误删新连接）
      if (connections.get(userId) === state) {
        cleanupConnection(state, 'client_disconnected')
        connections.delete(userId)
      }
    })

    ws.on('error', () => {
      if (connections.get(userId) === state) {
        cleanupConnection(state, 'ws_error')
        connections.delete(userId)
      }
    })
  })
}

// ===== 消息分发 =====

function handleMessage(state: ConnectionState, msg: WsClientMessage): void {
  console.log('[WS] Received message:', msg.type)
  switch (msg.type) {
    case 'start_build':
      handleStartBuild(state, msg)
      break

    case 'checkpoint_response':
      handleCheckpointResponse(state, msg)
      break

    case 'stop_build':
      state.stopped = true
      break
  }
}

// ===== start_build =====

function handleStartBuild(
  state: ConnectionState,
  msg: Extract<WsClientMessage, { type: 'start_build' }>,
): void {
  state.stopped = false

  const callbacks: OrchestratorCallbacks = {
    send: (serverMsg: WsServerMessage) => {
      if (state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify(serverMsg))
      }
    },

    waitForCheckpoint: (taskId: string) =>
      new Promise((resolve, reject) => {
        state.checkpointResolvers.set(taskId, { resolve, reject })
      }),

    isStopped: () => state.stopped,
  }

  // 异步执行，不 await — 构建过程通过 callbacks 推送结果
  orchestrate(state.userId, msg.projectSpec, msg.apiKey, callbacks).catch(() => {
    // orchestrate 内部已通过 callbacks.send 报告错误，这里只做兜底
  })
}

// ===== checkpoint_response =====

function handleCheckpointResponse(
  state: ConnectionState,
  msg: Extract<WsClientMessage, { type: 'checkpoint_response' }>,
): void {
  const pending = state.checkpointResolvers.get(msg.taskId)
  if (pending) {
    pending.resolve({ action: msg.action, note: msg.note })
    state.checkpointResolvers.delete(msg.taskId)
  }
}

// ===== 连接清理 =====

function cleanupConnection(state: ConnectionState, _reason: string): void {
  state.stopped = true

  // reject 所有挂起的 checkpoint resolver
  for (const [, pending] of state.checkpointResolvers) {
    pending.reject(new Error('connection_closed'))
  }
  state.checkpointResolvers.clear()
}
