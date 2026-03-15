import { Lock, CheckCircle } from '@phosphor-icons/react'
import type { BuildingStatus } from '@/hooks/useTownState'

interface BuildingCardProps {
  level: 1 | 2 | 3 | 4
  name: string
  status: BuildingStatus
  style?: React.CSSProperties
  onClick: () => void
}

const SVG_MAP: Record<number, { color: string; gray: string }> = {
  1: { color: '/assets/map/l1-color.svg', gray: '/assets/map/l1-gray.svg' },
  2: { color: '/assets/map/l2-color.svg', gray: '/assets/map/l2-gray.svg' },
  3: { color: '/assets/map/l3-color.svg', gray: '/assets/map/l3-gray.svg' },
  4: { color: '/assets/map/l4-color.svg', gray: '/assets/map/l4-gray.svg' },
}

export default function BuildingCard({ level, name, status, style, onClick }: BuildingCardProps) {
  const svgs = SVG_MAP[level]
  const src = status === 'completed' ? svgs.color : svgs.gray

  const isLocked = status === 'locked'
  const isCompleted = status === 'completed'

  return (
    <div
      className="building-card absolute flex flex-col items-center"
      data-clickable={!isLocked}
      style={{
        ...style,
        cursor: isLocked ? 'not-allowed' : 'pointer',
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${name} - ${isLocked ? '已锁定' : isCompleted ? '已完成' : '可进入'}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
    >
      {/* Building name label — above the building */}
      <span
        className="mb-1 whitespace-nowrap font-bold"
        style={{
          fontSize: 'var(--text-sm)',
          color: isLocked ? 'var(--color-locked)' : 'var(--text-primary)',
        }}
      >
        {name}
      </span>

      {/* Building image container */}
      <div className="relative">
        <img
          src={src}
          alt={name}
          className="building-img pointer-events-none select-none"
          style={{
            width: '100%',
            height: 'auto',
            filter: isLocked ? 'brightness(0.85)' : undefined,
            transition: 'transform var(--dur-standard) var(--ease-standard), filter var(--dur-standard) var(--ease-standard)',
          }}
          draggable={false}
        />

        {/* Lock overlay for locked buildings */}
        {isLocked && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(0,0,0,0.45)',
              }}
            >
              <Lock size={20} weight="bold" color="#fff" />
            </div>
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div
            className="absolute"
            style={{
              top: -4,
              right: -4,
              pointerEvents: 'none',
            }}
          >
            <CheckCircle
              size={28}
              weight="fill"
              style={{ color: 'var(--color-success)' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
