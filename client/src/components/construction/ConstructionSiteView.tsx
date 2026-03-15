import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'wouter'
import AgentCard from './AgentCard'
import ThinkingPanel from './ThinkingPanel'
import ConstructionDevMode, { CS_POSITIONS_KEY } from './ConstructionDevMode'
import type { ElementPosition } from './ConstructionDevMode'
import { AGENTS, THINKING_MESSAGES } from './mockData'

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

export default function ConstructionSiteView({ level }: ConstructionSiteViewProps) {
  const [, navigate] = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [devMode, setDevMode] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
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

  const getPos = useCallback((id: string) => {
    return elements.find(e => e.id === id) ?? DEFAULT_ELEMENTS.find(e => e.id === id)!
  }, [elements])

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

        {/* Agent cards grid */}
        <div
          data-ws-id="agent-grid"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignContent: 'flex-start',
          }}
        >
          {AGENTS.map(agent => (
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
      </div>

      {/* Right side — thinking panel */}
      <div style={{ flex: '0 0 40%' }}>
        <ThinkingPanel messages={THINKING_MESSAGES} />
      </div>

      {/* DEV: mock trigger for reveal */}
      {import.meta.env.DEV && !showReveal && (
        <button
          onClick={() => setShowReveal(true)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 900,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#E5594F',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          模拟构建完成
        </button>
      )}

      {/* Reveal Moment */}
      {showReveal && (
        <RevealMoment
          outputHtml={`<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f9ff;}h1{color:#3385FF;}</style></head><body><h1>Hello CodeTown!</h1></body></html>`}
          onBackToTown={() => navigate('/')}
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
