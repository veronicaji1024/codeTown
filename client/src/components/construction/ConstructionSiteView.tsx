import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'wouter'
import AgentCard from './AgentCard'
import ThinkingPanel from './ThinkingPanel'
import ConstructionDevMode, { CS_POSITIONS_KEY } from './ConstructionDevMode'
import type { ElementPosition } from './ConstructionDevMode'
import { AGENT_TEMPLATES } from './mockData'
import type { AgentData, AgentStatus } from './mockData'
import type { Task } from '@codetown/shared'
import { useBuildStore } from '@/store/buildStore'
import { wsService } from '@/services/websocket'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import type { ProjectSpec } from '@codetown/shared'

import RevealMoment from './RevealMoment'
import tabDeskIcon from '@/assets/construction/icons/tab-desk.svg'
import tabSiteIcon from '@/assets/construction/icons/tab-site.svg'

interface ConstructionSiteViewProps {
  level?: string
}

const DEFAULT_ELEMENTS: ElementPosition[] = [
  { id: 'tabs',            left: '2%',   top: '2%',   width: '20%' },
  { id: 'agent-grid',      left: '2%',   top: '10%',  width: '55%' },
  { id: 'thinking-panel',  left: '60%',  top: '0%',   width: '40%' },
]

function agentBaseType(agentType: string): string {
  if (agentType.startsWith('builder')) return 'builder'
  return agentType
}

function dagSummary(tasks: Task[]): string {
  return tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
}

export default function ConstructionSiteView({ level }: ConstructionSiteViewProps) {
  const [, navigate] = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [devMode, setDevMode] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const buildStartedRef = useRef(false)
  const [elements, setElements] = useState<ElementPosition[]>(() => {
    try {
      const saved = localStorage.getItem(CS_POSITIONS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ElementPosition[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          return DEFAULT_ELEMENTS.map(def => {
            const found = parsed.find(p => p.id === def.id)
            return found ?? def
          })
        }
      }
    } catch { /* ignore */ }
    return DEFAULT_ELEMENTS
  })

  // Get Supabase access token
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccessToken(session?.access_token ?? null)
    })
  }, [])

  // Connect to WS via buildStore
  const build = useBuildStore(accessToken)

  // 当 WS 重连导致 status 重置为 idle 时，允许 auto-start 再次触发
  useEffect(() => {
    if (build.status === 'idle') {
      buildStartedRef.current = false
    }
  }, [build.status])

  // Auto-start build once WS is connected and we have spec + apiKey
  useEffect(() => {
    if (buildStartedRef.current) return
    if (!build.wsReady) return

    const specJson = sessionStorage.getItem('ct_build_spec')
    const apiKey = sessionStorage.getItem('ct_api_key')

    if (!specJson || !apiKey) {
      toast({ title: '缺少构建参数', description: '请从设计桌开始构建流程' })
      return
    }

    try {
      const spec = JSON.parse(specJson) as ProjectSpec
      buildStartedRef.current = true
      build.startBuild(spec, apiKey)
    } catch {
      toast({ title: '规格数据错误', description: '无法解析项目规格' })
    }
  }, [build.wsReady, build.startBuild])

  // 重试：断开旧连接 → 重置状态 → 重新获取 token 触发重连
  const handleRetry = () => {
    buildStartedRef.current = false
    build.reset()
    wsService.disconnect() // 显式断开，让 connect() 知道需要新建连接
    setAccessToken(null)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccessToken(session?.access_token ?? null)
    })
  }

  // Dynamically generate agent cards from DAG tasks
  const agents: AgentData[] = useMemo(() => {
    const plannerTpl = AGENT_TEMPLATES.planner

    // Phase 1: idle/planning → only show planner card
    const KNOWLEDGE_PLACEHOLDER = '正在生成知识中…'

    if (build.status === 'idle' || build.status === 'planning') {
      const plannerStatus: AgentStatus = build.status === 'planning' ? 'running' : 'pending'
      return [{
        id: 'planner',
        name: plannerTpl.name,
        role: plannerTpl.role,
        description: build.status === 'planning' ? '正在规划施工方案…' : '等待开始',
        status: plannerStatus,
        avatar: plannerTpl.avatar,
        thinkingIcon: plannerTpl.thinkingIcon,
        cardBg: plannerTpl.cardBg,
        teachingMoment: plannerStatus === 'running' ? KNOWLEDGE_PLACEHOLDER : undefined,
      }]
    }

    // Phase 2: building/complete/failed → planner done + task cards from DAG
    const plannerCard: AgentData = {
      id: 'planner',
      name: plannerTpl.name,
      role: plannerTpl.role,
      description: dagSummary(build.tasks),
      status: 'done',
      avatar: plannerTpl.avatar,
      thinkingIcon: plannerTpl.thinkingIcon,
      cardBg: plannerTpl.cardBg,
      teachingMoment: plannerTpl.teachingMoment,
    }

    const taskCards: AgentData[] = build.tasks.map(task => {
      const baseType = agentBaseType(task.agentType)
      const tpl = AGENT_TEMPLATES[baseType] || AGENT_TEMPLATES.builder
      return {
        id: task.id,
        name: tpl.name,
        role: tpl.role,
        description: task.title,
        status: task.status as AgentStatus,
        avatar: tpl.avatar,
        thinkingIcon: tpl.thinkingIcon,
        cardBg: tpl.cardBg,
        teachingMoment: task.status === 'done' ? tpl.teachingMoment
          : task.status === 'running' ? KNOWLEDGE_PLACEHOLDER
          : undefined,
      }
    })

    return [plannerCard, ...taskCards]
  }, [build.status, build.tasks])

  // D key toggle (dev only)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'd' || e.key === 'D') setDevMode(prev => !prev)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Left side — cream/beige background */}
      <div
        style={{
          flex: '0 0 60%',
          backgroundColor: '#F5E6C8',
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Tab bar */}
        <div data-ws-id="tabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div
            onClick={() => level && navigate(`/level/${level}/desk`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: '#fff',
              fontSize: 14,
              fontWeight: 600,
              color: '#666',
              cursor: level ? 'pointer' : 'default',
            }}
          >
            <img src={tabDeskIcon} alt="" style={{ width: 18, height: 18 }} draggable={false} />
            设计桌
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: '#22c55e',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'default',
            }}
          >
            <img
              src={tabSiteIcon}
              alt=""
              style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)' }}
              draggable={false}
            />
            工地
          </div>
        </div>

        {/* 连接中状态 */}
        {build.status === 'idle' && !build.wsReady && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: 12,
          }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid #ccc',
              borderTopColor: '#22c55e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: 15, color: '#666' }}>正在连接服务器…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* 错误面板 */}
        {build.status === 'failed' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: 16,
          }}>
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '24px 32px',
              maxWidth: 420,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#9888;</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#991B1B', marginBottom: 8 }}>
                构建失败
              </div>
              <div style={{ fontSize: 14, color: '#7F1D1D', marginBottom: 20, lineHeight: 1.5 }}>
                {build.errorMessage || '发生未知错误'}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleRetry}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    backgroundColor: '#22c55e',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  重试
                </button>
                <button
                  onClick={() => level && navigate(`/level/${level}/desk`)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    color: '#666',
                    fontWeight: 600,
                    fontSize: 14,
                    border: '1px solid #ddd',
                    cursor: level ? 'pointer' : 'default',
                  }}
                >
                  返回设计桌
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent cards grid — 仅在非错误状态时显示 */}
        {build.status !== 'failed' && (build.status !== 'idle' || build.wsReady) && (
        <div
          data-ws-id="agent-grid"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignContent: 'flex-start',
          }}
        >
          {agents.map(agent => (
            <div
              key={agent.id}
              style={{
                width: 'calc(25% - 12px)',
                minWidth: 160,
              }}
            >
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Right side — thinking panel */}
      <div style={{ flex: '0 0 40%' }}>
        <ThinkingPanel messages={build.mirrorBubbles} />
      </div>

      {/* Reveal Moment */}
      {build.status === 'complete' && build.outputHtml && (
        <RevealMoment
          outputHtml={build.outputHtml}
          onBackToTown={() => {
            build.reset()
            navigate('/')
          }}
        />
      )}

      {/* Dev Mode Overlay */}
      {devMode && (
        <ConstructionDevMode
          elements={elements}
          onElementsChange={setElements}
          containerRef={containerRef}
          onSave={() => {
            localStorage.setItem(CS_POSITIONS_KEY, JSON.stringify(elements))
            setDevMode(false)
          }}
          onReset={() => {
            localStorage.removeItem(CS_POSITIONS_KEY)
            setElements(DEFAULT_ELEMENTS)
          }}
        />
      )}
    </div>
  )
}
