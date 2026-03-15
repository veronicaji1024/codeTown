import { Lock, X } from '@phosphor-icons/react'
import type { SlotConfig } from '@/hooks/useProjectSpec'

interface CardSlotProps {
  slot: SlotConfig
  isFilled: boolean
  onRemove: () => void
  children?: React.ReactNode
}

export default function CardSlot({ slot, isFilled, onRemove, children }: CardSlotProps) {
  if (slot.status === 'locked') {
    return (
      <div
        className="relative flex items-center justify-center rounded-lg"
        style={{
          minHeight: 48,
          backgroundColor: '#f0ede6',
          border: '2px dashed var(--color-locked)',
          opacity: 0.5,
        }}
      >
        <div className="flex items-center gap-1.5" style={{ color: 'var(--color-locked)', fontSize: 'var(--text-xs)' }}>
          <Lock size={14} weight="bold" />
          <span>{slot.label} · 第{slot.unlockLevel}关解锁</span>
        </div>
      </div>
    )
  }

  if (isFilled) {
    return (
      <div
        className="relative rounded-lg"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--color-divider)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 z-10 flex items-center justify-center rounded-full"
          style={{
            width: 20,
            height: 20,
            backgroundColor: 'rgba(0,0,0,0.08)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={12} weight="bold" style={{ color: 'var(--text-secondary)' }} />
        </button>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg ${slot.status === 'required' ? 'animate-pulse-ring' : ''}`}
      style={{
        minHeight: 48,
        backgroundImage: 'url(/assets/workspace/card-slot.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: slot.status === 'optional' ? '2px dashed var(--color-divider)' : '2px solid transparent',
        backgroundColor: '#f5f2ec',
      }}
    >
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-placeholder)', fontWeight: 500 }}>
        {slot.label}
        {slot.status === 'required' && <span style={{ color: 'var(--color-accent)', marginLeft: 4 }}>*</span>}
      </span>
    </div>
  )
}
