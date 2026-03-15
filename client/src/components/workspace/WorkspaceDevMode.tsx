import { useState, useCallback, useRef, useEffect } from 'react'
import { FOLDERS } from './folderConfig'

export interface ElementPosition {
  id: string
  left: string   // percentage
  top: string    // percentage
  width: string  // percentage
}

export const WS_POSITIONS_KEY = 'codetown-workspace-positions'

interface WorkspaceDevModeProps {
  elements: ElementPosition[]
  onElementsChange: (elements: ElementPosition[]) => void
  onSave: () => void
  onReset: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

type DragAction = { type: 'move'; id: string } | { type: 'resize'; id: string }

// Get a display label for an element
function getDisplayLabel(id: string): string {
  if (id.startsWith('label-')) {
    const folder = FOLDERS.find(f => `label-${f.type}` === id)
    return folder?.label ?? id
  }
  return id
}

export default function WorkspaceDevMode({
  elements,
  onElementsChange,
  onSave,
  onReset,
  containerRef,
}: WorkspaceDevModeProps) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/__dev/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elements),
      })
      if (res.ok) {
        onSave()
      } else {
        const data = await res.json().catch(() => ({}))
        console.error('Save positions failed:', data)
        // Fallback: still call onSave which saves to localStorage
        onSave()
      }
    } catch (err) {
      console.error('Save positions error:', err)
      // Fallback: still call onSave which saves to localStorage
      onSave()
    } finally {
      setSaving(false)
    }
  }
  const [action, setAction] = useState<DragAction | null>(null)
  const startRef = useRef<{ x: number; y: number; left: number; top: number; width: number } | null>(null)
  const [rects, setRects] = useState<Record<string, DOMRect>>({})

  // Measure actual rendered elements by their data-ws-id attribute
  useEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const newRects: Record<string, DOMRect> = {}
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      elements.forEach(el => {
        const dom = container.querySelector(`[data-ws-id="${el.id}"]`) as HTMLElement | null
        if (dom) {
          const r = dom.getBoundingClientRect()
          newRects[el.id] = new DOMRect(
            r.left - containerRect.left,
            r.top - containerRect.top,
            r.width,
            r.height
          )
        }
      })
      setRects(newRects)
    }
    measure()
    const timer = setInterval(measure, 300)
    return () => clearInterval(timer)
  }, [elements, containerRef])

  const handleMoveDown = useCallback((id: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = elements.find(p => p.id === id)
    if (!el) return
    setAction({ type: 'move', id })
    startRef.current = {
      x: e.clientX, y: e.clientY,
      left: parseFloat(el.left), top: parseFloat(el.top), width: parseFloat(el.width),
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [elements])

  const handleResizeDown = useCallback((id: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = elements.find(p => p.id === id)
    if (!el) return
    setAction({ type: 'resize', id })
    startRef.current = {
      x: e.clientX, y: e.clientY,
      left: parseFloat(el.left), top: parseFloat(el.top), width: parseFloat(el.width),
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [elements])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!action || !startRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - startRef.current.x) / rect.width) * 100
    const dy = ((e.clientY - startRef.current.y) / rect.height) * 100

    if (action.type === 'move') {
      const newLeft = Math.max(-5, Math.min(95, startRef.current.left + dx))
      const newTop = Math.max(-5, Math.min(95, startRef.current.top + dy))
      onElementsChange(elements.map(el =>
        el.id === action.id ? { ...el, left: `${newLeft.toFixed(1)}%`, top: `${newTop.toFixed(1)}%` } : el
      ))
    } else {
      const newW = Math.max(2, Math.min(80, startRef.current.width + dx))
      onElementsChange(elements.map(el =>
        el.id === action.id ? { ...el, width: `${newW.toFixed(1)}%` } : el
      ))
    }
  }, [action, elements, onElementsChange, containerRef])

  const handlePointerUp = useCallback(() => {
    setAction(null)
    startRef.current = null
  }, [])

  return (
    <>
      {/* Yellow dev banner */}
      <div
        className="fixed left-0 right-0 z-[60] flex items-center justify-center gap-4 py-1"
        style={{ top: 0, backgroundColor: 'var(--color-warning)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}
      >
        <span>DEV: 拖中间移动，拖右下角缩放 (D 退出)</span>
        <button onClick={handleSave} disabled={saving} style={{ padding: '2px 12px', backgroundColor: '#16a34a', color: '#fff', borderRadius: 4, border: 'none', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: '12px', opacity: saving ? 0.6 : 1 }}>
          {saving ? '保存中...' : '定稿保存'}
        </button>
        <button onClick={onReset} style={{ padding: '2px 12px', backgroundColor: '#dc2626', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
          重置默认
        </button>
      </div>

      {/* Overlay handles — positioned by measuring actual rendered elements */}
      {elements.map(el => {
        const isLabel = el.id.startsWith('label-')
        const r = rects[el.id]
        if (!r) return null

        return (
          <div
            key={el.id}
            className="z-[55]"
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: r.width,
              height: r.height,
              touchAction: 'none',
              outline: '2px dashed rgba(51,133,255,0.7)',
              outlineOffset: 0,
              borderRadius: 2,
              cursor: action?.type === 'move' && action.id === el.id ? 'grabbing' : 'grab',
            }}
            onPointerDown={e => handleMoveDown(el.id, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Resize handle — only for non-label elements */}
            {!isLabel && (
              <div
                style={{
                  position: 'absolute', right: -4, bottom: -4,
                  width: 10, height: 10,
                  backgroundColor: 'var(--color-primary)', border: '2px solid #fff',
                  borderRadius: 2, cursor: 'nwse-resize', zIndex: 56,
                }}
                onPointerDown={e => { e.stopPropagation(); handleResizeDown(el.id, e) }}
              />
            )}

            {/* Info label */}
            <div
              className="rounded px-1 py-0.5"
              style={{
                position: 'absolute', bottom: -16, left: 0,
                fontSize: '9px', fontFamily: 'monospace',
                backgroundColor: 'rgba(0,0,0,0.85)', color: '#fff',
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 60,
              }}
            >
              {getDisplayLabel(el.id)} | {el.left},{el.top}
            </div>
          </div>
        )
      })}
    </>
  )
}
