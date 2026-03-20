import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { Task, TaskDAG, WsServerMessage, ProjectSpec, UserPublic } from '@codetown/shared'
import type { ThinkingMessageData } from '../components/construction/mockData'
import { AGENT_TEMPLATES } from '../components/construction/mockData'
import { wsService } from '../services/websocket'

// ===== Agent 颜色 & 图标映射 =====

const AGENT_COLOR: Record<string, string> = {
  planner: '#EF7267',
  builder_structure: '#3385FF',
  builder_style: '#3385FF',
  builder_logic: '#3385FF',
  builder_skill: '#3385FF',
  tester: '#4CAF50',
  reviewer: '#FF9800',
}

function agentDisplayName(agentType: string): string {
  if (agentType.startsWith('builder')) return '建造者'
  switch (agentType) {
    case 'planner': return '计划者'
    case 'tester': return '测试者'
    case 'reviewer': return '审核者'
    default: return agentType
  }
}

function agentBaseType(agentType: string): string {
  if (agentType.startsWith('builder')) return 'builder'
  return agentType
}

// ===== State =====

export type BuildStatus = 'idle' | 'planning' | 'building' | 'complete' | 'failed'

export interface BuildState {
  status: BuildStatus
  tasks: Task[]
  mirrorBubbles: ThinkingMessageData[]
  outputHtml: string | null
  shareSlug: string | null
  updatedUser: UserPublic | null
  errorMessage: string | null
  wsReady: boolean
}

const initialState: BuildState = {
  status: 'idle',
  tasks: [],
  mirrorBubbles: [],
  outputHtml: null,
  shareSlug: null,
  updatedUser: null,
  errorMessage: null,
  wsReady: false,
}

// ===== Actions =====

type BuildAction =
  | { type: 'WS_READY' }
  | { type: 'WS_ERROR'; message: string }
  | { type: 'START_BUILD' }
  | { type: 'PLAN_COMPLETE'; dag: TaskDAG }
  | { type: 'TASK_STARTED'; taskId: string; agentId: string }
  | { type: 'MIRROR_CHUNK'; agentId: string; content: string; isComplete: boolean }
  | { type: 'TASK_DONE'; taskId: string }
  | { type: 'TEST_RESULT'; taskId: string; passed: boolean }
  | { type: 'CHECKPOINT'; taskId: string; preview: string }
  | { type: 'BUILD_COMPLETE'; outputHtml: string; shareSlug: string; updatedUser?: UserPublic }
  | { type: 'BUILD_ERROR'; message: string }
  | { type: 'RESET' }

// ===== agentId → agentType 映射（从 agentId 前缀推断）=====

function inferAgentType(agentId: string): string {
  // agentId 格式: "{agentType}-{nanoid}" 例如 "planner-abc12345"
  const idx = agentId.lastIndexOf('-')
  if (idx > 0) return agentId.slice(0, idx)
  return agentId
}

// ===== Reducer =====

function buildReducer(state: BuildState, action: BuildAction): BuildState {
  switch (action.type) {
    case 'WS_READY':
      // 如果之前失败了，重连成功后重置为 idle 让 auto-start 可以重新触发
      if (state.status === 'failed') {
        return { ...initialState, wsReady: true }
      }
      return { ...state, wsReady: true, errorMessage: null }

    case 'WS_ERROR':
      // 不覆盖已完成的状态
      if (state.status === 'complete') return state
      return { ...state, status: 'failed', wsReady: false, errorMessage: action.message }

    case 'START_BUILD':
      return { ...initialState, status: 'planning', wsReady: true }

    case 'PLAN_COMPLETE':
      return {
        ...state,
        status: 'building',
        tasks: action.dag.tasks,
      }

    case 'TASK_STARTED':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId ? { ...t, status: 'running' as const } : t,
        ),
      }

    case 'MIRROR_CHUNK': {
      const agentType = inferAgentType(action.agentId)
      const bubbleId = action.agentId
      const existing = state.mirrorBubbles.find(b => b.id === bubbleId)

      if (existing) {
        if (action.isComplete) {
          // 标记完成：在内容前加 [完成] 前缀
          return {
            ...state,
            mirrorBubbles: state.mirrorBubbles.map(b =>
              b.id === bubbleId
                ? { ...b, content: `[完成] ${b.content}` }
                : b,
            ),
          }
        }
        // 追加内容
        return {
          ...state,
          mirrorBubbles: state.mirrorBubbles.map(b =>
            b.id === bubbleId
              ? { ...b, content: b.content + action.content }
              : b,
          ),
        }
      }

      // 新气泡
      const newBubble: ThinkingMessageData = {
        id: bubbleId,
        agentId: agentBaseType(agentType),
        agentName: agentDisplayName(agentType),
        content: action.content,
        icon: AGENT_TEMPLATES[agentBaseType(agentType)]?.thinkingIcon || '',
        color: AGENT_COLOR[agentType] || '#999',
      }

      return {
        ...state,
        mirrorBubbles: [...state.mirrorBubbles, newBubble],
      }
    }

    case 'TASK_DONE':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId ? { ...t, status: 'done' as const } : t,
        ),
      }

    case 'TEST_RESULT':
      if (!action.passed) {
        return {
          ...state,
          tasks: state.tasks.map(t =>
            t.id === action.taskId ? { ...t, status: 'failed' as const } : t,
          ),
        }
      }
      return state

    case 'CHECKPOINT':
      // checkpoint 数据暂存，由组件层读取 tasks 中的 isCheckpoint 标记处理
      return state

    case 'BUILD_COMPLETE':
      return {
        ...state,
        status: 'complete',
        outputHtml: action.outputHtml,
        shareSlug: action.shareSlug,
        updatedUser: action.updatedUser ?? null,
      }

    case 'BUILD_ERROR':
      return {
        ...state,
        status: 'failed',
        errorMessage: action.message,
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ===== Hook =====

export function useBuildStore(authToken: string | null) {
  const [state, dispatch] = useReducer(buildReducer, initialState)
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 延迟断开：Strict Mode 下 cleanup 会立即重新 mount，取消断开
  // 真正卸载时 100ms 后无人取消 → 执行断开
  useEffect(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current)
      disconnectTimerRef.current = null
    }
    return () => {
      disconnectTimerRef.current = setTimeout(() => {
        wsService.disconnect()
      }, 100)
    }
  }, [])

  // 注册 WS 消息监听
  useEffect(() => {
    const handler = (msg: WsServerMessage) => {
      const d = dispatchRef.current
      switch (msg.type) {
        case 'plan_complete':
          d({ type: 'PLAN_COMPLETE', dag: msg.dag })
          break
        case 'task_started':
          d({ type: 'TASK_STARTED', taskId: msg.taskId, agentId: msg.agentId })
          break
        case 'mirror_chunk':
          d({ type: 'MIRROR_CHUNK', agentId: msg.agentId, content: msg.content, isComplete: msg.isComplete })
          break
        case 'task_done':
          d({ type: 'TASK_DONE', taskId: msg.taskId })
          break
        case 'test_result':
          d({ type: 'TEST_RESULT', taskId: msg.taskId, passed: msg.passed })
          break
        case 'checkpoint':
          d({ type: 'CHECKPOINT', taskId: msg.taskId, preview: msg.preview })
          break
        case 'build_complete':
          d({ type: 'BUILD_COMPLETE', outputHtml: msg.outputHtml, shareSlug: msg.shareSlug, updatedUser: msg.updatedUser })
          break
        case 'build_error':
          d({ type: 'BUILD_ERROR', message: msg.message })
          break
        // agent_chunk 不在 store 中处理（由组件直接使用或忽略）
      }
    }

    wsService.onMessage = handler
    return () => {
      wsService.onMessage = () => {}
    }
  }, [])

  // 连接 WS
  useEffect(() => {
    if (authToken) {
      wsService.onOpen = () => {
        dispatchRef.current({ type: 'WS_READY' })
      }
      wsService.onClose = (code: number, reason: string) => {
        // 正常关闭（1000）不报错
        if (code === 1000) return
        const d = dispatchRef.current
        const msg = code === 4001
          ? '身份验证失败，请重新登录'
          : `[code ${code}] ${reason}`
        d({ type: 'WS_ERROR', message: msg })
      }
      wsService.onError = (_err: Event, detail: string) => {
        dispatchRef.current({ type: 'WS_ERROR', message: detail })
      }
      // connect() 是幂等的：相同 token 不会重复创建连接
      wsService.connect(authToken)
    } else {
      // token 变为 null（登出） → 立即断开
      wsService.disconnect()
    }
    return () => {
      // 只重置回调，不 disconnect — 由延迟断开 effect 处理真正卸载
      wsService.onOpen = () => {}
      wsService.onClose = () => {}
      wsService.onError = () => {}
    }
  }, [authToken])

  // 操作方法
  const startBuild = useCallback((projectSpec: ProjectSpec, apiKey: string) => {
    dispatch({ type: 'START_BUILD' })
    const sent = wsService.send({ type: 'start_build', projectSpec, apiKey })
    if (!sent) {
      dispatch({ type: 'BUILD_ERROR', message: 'WebSocket 连接已断开，无法发送构建请求' })
    }
  }, [])

  const stopBuild = useCallback(() => {
    wsService.send({ type: 'stop_build' })
  }, [])

  const respondCheckpoint = useCallback((taskId: string, action: 'approve' | 'modify', note?: string) => {
    wsService.send({ type: 'checkpoint_response', taskId, action, note })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return {
    ...state,
    startBuild,
    stopBuild,
    respondCheckpoint,
    reset,
  }
}
