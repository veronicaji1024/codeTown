import { useState, useEffect, useCallback, useRef } from 'react'

export interface BuildingPosition {
  level: number
  left: string
  bottom: string
  width: string
}

export const POSITIONS_STORAGE_KEY = 'codetown-building-positions'

interface DevPositionModeProps {
  positions: BuildingPosition[]
  onPositionsChange: (positions: BuildingPosition[]) => void
  onSave: () => void
  onReset: () => void
}

export default function DevPositionMode({ positions, onPositionsChange, onSave, onReset }: DevPositionModeProps) {
  const [dragging, setDragging] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<{ x: number; y: number; left: number; bottom: number } | null>(null)

  useEffect(() => {
    const el = document.querySelector('[data-map-container]') as HTMLDivElement | null
    containerRef.current = el
  }, [])

  // Scroll wheel to resize building width
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      const target = (e.target as HTMLElement).closest('[data-dev-handle]')
      if (!target) return
      e.preventDefault()
      const level = Number(target.getAttribute('data-dev-handle'))
      const delta = e.deltaY > 0 ? -1 : 1

      const next = positions.map(p => {
        if (p.level !== level) return p
        const currentW = parseFloat(p.width)
        const newW = Math.max(5, Math.min(60, currentW + delta))
        return { ...p, width: `${newW.toFixed(1)}%` }
      })
      onPositionsChange(next)
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [positions, onPositionsChange])

  const handlePointerDown = useCallback((level: number, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const pos = positions.find(p => p.level === level)
    if (!pos) return
    setDragging(level)
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: parseFloat(pos.left),
      bottom: parseFloat(pos.bottom),
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [positions])

  const handlePointerMove = useCallback((level: number, e: React.PointerEvent) => {
    if (dragging !== level || !startRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - startRef.current.x) / rect.width) * 100
    const dy = ((e.clientY - startRef.current.y) / rect.height) * 100
    const newLeft = Math.max(0, Math.min(90, startRef.current.left + dx))
    const newBottom = Math.max(0, Math.min(90, startRef.current.bottom - dy))

    const next = positions.map(p =>
      p.level === level
        ? { ...p, left: `${newLeft.toFixed(1)}%`, bottom: `${newBottom.toFixed(1)}%` }
        : p
    )
    onPositionsChange(next)
  }, [dragging, positions, onPositionsChange])

  const handlePointerUp = useCallback((level: number) => {
    if (dragging === level) {
      setDragging(null)
      startRef.current = null
    }
  }, [dragging])

  return (
    <>
      {/* Yellow dev banner with action buttons */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center justify-center gap-4 py-1"
        style={{
          top: 'var(--topbar-height)',
          backgroundColor: 'var(--color-warning)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span>DEV: Drag to move, Scroll to resize (press D to exit)</span>
        <button
          onClick={onSave}
          style={{
            padding: '2px 12px',
            backgroundColor: '#16a34a',
            color: '#fff',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          ✓ 定稿保存
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '2px 12px',
            backgroundColor: '#dc2626',
            color: '#fff',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          重置默认
        </button>
      </div>

      {/* Drag + resize handles for each building */}
      {positions.map(pos => (
        <div
          key={pos.level}
          data-dev-handle={pos.level}
          className="absolute z-40"
          style={{
            left: pos.left,
            bottom: pos.bottom,
            width: pos.width,
            cursor: dragging === pos.level ? 'grabbing' : 'grab',
            touchAction: 'none',
            outline: '2px dashed rgba(51,133,255,0.6)',
            outlineOffset: 2,
            borderRadius: 4,
          }}
          onPointerDown={e => handlePointerDown(pos.level, e)}
          onPointerMove={e => handlePointerMove(pos.level, e)}
          onPointerUp={() => handlePointerUp(pos.level)}
        >
          {/* Info label — show below the handle so tall buildings don't push it off-screen */}
          <div
            className="rounded px-1.5 py-0.5"
            style={{
              position: 'absolute',
              bottom: -22,
              left: 0,
              fontSize: '11px',
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0,0,0,0.75)',
              color: '#fff',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            L{pos.level} | {pos.left}, {pos.bottom} | w:{pos.width}
          </div>
          {/* Transparent hit area */}
          <div style={{ width: '100%', paddingBottom: '100%' }} />
        </div>
      ))}
    </>
  )
}
