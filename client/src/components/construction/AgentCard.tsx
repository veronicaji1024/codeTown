import { useState } from 'react'
import { CheckCircle, XCircle } from '@phosphor-icons/react'
import type { AgentData, AgentStatus } from './mockData'
import hourglassIcon from '@/assets/construction/icons/hourglass.svg'
import brainIcon from '@/assets/construction/icons/brain.svg'
import knowledgeBg from '@/assets/construction/shapes/knowledge-bg.svg'

interface AgentCardProps {
  agent: AgentData
}

const statusBorder: Record<AgentStatus, string> = {
  pending: 'none',
  running: '3px solid #3385FF',
  done: '3px solid #22c55e',
  failed: '3px solid #ef4444',
}

const avatarAnimation: Record<AgentStatus, string> = {
  pending: 'none',
  running: 'agent-float 2s ease-in-out infinite',
  done: 'bounce-in 0.5s var(--ease-bounce)',
  failed: 'shake 0.5s ease-in-out',
}

const avatarOpacity: Record<AgentStatus, number> = {
  pending: 0.5,
  running: 1,
  done: 1,
  failed: 1,
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [hasSeenTM, setHasSeenTM] = useState(false)

  const canFlip = !!agent.teachingMoment

  const handleClick = () => {
    if (!canFlip) return
    if (!hasSeenTM) setHasSeenTM(true)
    setIsFlipped(prev => !prev)
  }

  // TM pulse: only show pulse when done (real content ready) AND user hasn't flipped yet
  const isPlaceholder = agent.teachingMoment === '正在生成知识中…'
  const showTMPulse = canFlip && !hasSeenTM && !isPlaceholder

  return (
    <div
      data-ws-id={`agent-${agent.id}`}
      style={{
        perspective: '800px',
        cursor: canFlip ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          transition: 'transform 0.6s ease-in-out',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'relative',
            backfaceVisibility: 'hidden',
            backgroundColor: '#fff',
            borderRadius: 16,
            border: statusBorder[agent.status],
            padding: '20px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 340,
            overflow: 'hidden',
            animation: showTMPulse ? 'tm-pulse 2s infinite' : 'none',
          }}
        >
          {/* Status badge */}
          {agent.status === 'done' && (
            <CheckCircle
              size={24}
              weight="fill"
              color="#22c55e"
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
            />
          )}
          {agent.status === 'failed' && (
            <XCircle
              size={24}
              weight="fill"
              color="#ef4444"
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
            />
          )}

          {/* Background decoration */}
          <img
            src={agent.cardBg}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />

          {/* Avatar */}
          <img
            src={agent.avatar}
            alt={agent.name}
            draggable={false}
            style={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
              opacity: avatarOpacity[agent.status],
              animation: avatarAnimation[agent.status],
            }}
          />

          {/* Name */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1A1A1A',
              marginTop: 8,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {agent.name}
          </div>

          {/* Description -- scrollable */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: 12,
              color: '#666',
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 1.5,
              position: 'relative',
              zIndex: 1,
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {agent.description}
          </div>

          {/* Bottom icon */}
          <img
            src={hourglassIcon}
            alt=""
            draggable={false}
            style={{
              width: 20,
              height: 20,
              marginTop: 8,
              position: 'relative',
              zIndex: 1,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Back face (knowledge card) */}
        {canFlip && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: '#FFCBCB',
              borderRadius: 16,
              padding: '20px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Background decoration */}
            <img
              src={knowledgeBg}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.2,
                pointerEvents: 'none',
              }}
            />

            {/* Title */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1A1A1A',
                position: 'relative',
                zIndex: 1,
                marginBottom: 12,
              }}
            >
              知识卡片
            </div>

            {/* Teaching content -- scrollable */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: 13,
                color: '#333',
                lineHeight: 1.6,
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                flex: 1,
                whiteSpace: 'pre-line',
                overflowY: 'auto',
              }}
            >
              {agent.teachingMoment}
            </div>

            {/* Brain icon at bottom */}
            <img
              src={brainIcon}
              alt=""
              draggable={false}
              style={{
                width: 24,
                height: 24,
                marginTop: 8,
                position: 'relative',
                zIndex: 1,
                opacity: 0.6,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
