import { useState } from 'react'
import { ShareNetwork, ArrowCounterClockwise, HouseSimple } from '@phosphor-icons/react'
import { toast } from '@/hooks/use-toast'
import Confetti from './Confetti'

interface RevealMomentProps {
  outputHtml: string
  onBackToTown: () => void
}

export default function RevealMoment({ outputHtml, onBackToTown }: RevealMomentProps) {
  const [phase, setPhase] = useState<'curtain' | 'revealed'>('curtain')

  if (phase === 'curtain') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(34, 34, 34, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '70vw',
            height: '70vh',
            border: 'none',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 253, 247, 0.95)',
          }}
        >
          <button
            onClick={() => setPhase('revealed')}
            style={{
              padding: '16px 48px',
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              backgroundColor: '#FF9800',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            揭幕!
          </button>
        </div>
      </div>
    )
  }

  // phase === 'revealed'
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(34, 34, 34, 0.55)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Confetti />

      {/* iframe container */}
      <div
        style={{
          width: '70vw',
          height: '65vh',
          borderRadius: 12,
          overflow: 'hidden',
          animation: 'bounce-in 0.6s ease-out',
          opacity: 1,
        }}
      >
        <iframe
          srcDoc={outputHtml}
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 12,
            backgroundColor: '#fff',
          }}
          title="构建成果"
        />
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 20,
        }}
      >
        <ActionButton
          icon={<ShareNetwork size={20} weight="bold" />}
          label="分享给朋友"
          onClick={() => toast({ title: '功能开发中', description: '分享功能即将上线' })}
        />
        <ActionButton
          icon={<ArrowCounterClockwise size={20} weight="bold" />}
          label="重新建造"
          onClick={() => toast({ title: '功能开发中', description: '重新建造功能即将上线' })}
        />
        <ActionButton
          icon={<HouseSimple size={20} weight="bold" />}
          label="回到小镇"
          onClick={onBackToTown}
        />
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        fontSize: 14,
        fontWeight: 600,
        color: '#1A1A1A',
        backgroundColor: '#FFFDF7',
        border: '2px solid #E8E2D4',
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
