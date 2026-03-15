import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'wouter'
import type { User } from '@supabase/supabase-js'
import { useTownState } from '@/hooks/useTownState'
import { useApiKey } from '@/hooks/useApiKey'
import { toast } from '@/hooks/use-toast'
import TopNav from '@/components/shared/TopNav'
import BuildingCard from '@/components/map/BuildingCard'
import BYOKModal from '@/components/shared/BYOKModal'
import DevPositionMode, { POSITIONS_STORAGE_KEY } from '@/components/map/DevPositionMode'
import type { BuildingPosition } from '@/components/map/DevPositionMode'

interface TownMapProps {
  user: User
  onSignOut: () => void
}

const MAP_ASPECT_RATIO = 25134 / 14027 // ≈ 1.792

// Building positions — from fullscreen dev-mode adjustment (截图！.png)
const DEFAULT_POSITIONS: BuildingPosition[] = [
  { level: 1, left: '3.2%',  bottom: '34.5%', width: '25%' },
  { level: 2, left: '25.9%', bottom: '16.0%', width: '22%' },
  { level: 3, left: '40.2%', bottom: '26.7%', width: '42%' },
  { level: 4, left: '67.2%', bottom: '26.5%', width: '31%' },
]

export default function TownMap({ user, onSignOut }: TownMapProps) {
  const [, navigate] = useLocation()
  const { buildings, completeLevel } = useTownState()
  const { apiKey, setApiKey } = useApiKey()
  const [byokOpen, setByokOpen] = useState(false)
  const [pendingLevel, setPendingLevel] = useState<number | null>(null)
  const [completedMenuLevel, setCompletedMenuLevel] = useState<number | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [positions, setPositions] = useState<BuildingPosition[]>(() => {
    try {
      const saved = localStorage.getItem(POSITIONS_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return DEFAULT_POSITIONS
  })

  // Compute cover-fit dimensions so the map container always maintains
  // the correct aspect ratio (fixes fullscreen vs non-fullscreen mismatch)
  const mapAreaRef = useRef<HTMLDivElement>(null)
  const [coverSize, setCoverSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const el = mapAreaRef.current
    if (!el) return

    const update = () => {
      const pw = el.clientWidth
      const ph = el.clientHeight
      if (pw === 0 || ph === 0) return

      if (pw / ph > MAP_ASPECT_RATIO) {
        // Parent is wider than map — width-constrained
        setCoverSize({ width: pw, height: pw / MAP_ASPECT_RATIO })
      } else {
        // Parent is taller than map — height-constrained
        setCoverSize({ width: ph * MAP_ASPECT_RATIO, height: ph })
      }
    }

    const observer = new ResizeObserver(update)
    observer.observe(el)
    update()
    return () => observer.disconnect()
  }, [])

  // Dev position mode toggle (D key, dev only)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        // Don't trigger when typing in inputs
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
        setDevMode(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleBuildingClick = useCallback((level: number) => {
    const building = buildings.find(b => b.level === level)
    if (!building) return

    if (building.status === 'locked') {
      const prevLevel = level - 1
      toast({
        title: '尚未解锁',
        description: `完成第 ${prevLevel} 关后解锁此建筑`,
      })
      return
    }

    if (building.status === 'completed') {
      setCompletedMenuLevel(level)
      return
    }

    // unlocked — check API key
    if (!apiKey) {
      setPendingLevel(level)
      setByokOpen(true)
      return
    }

    navigate(`/level/${level}/desk`)
  }, [buildings, apiKey, navigate])

  const handleKeySubmit = useCallback((key: string) => {
    setApiKey(key)
    setByokOpen(false)
    if (pendingLevel) {
      navigate(`/level/${pendingLevel}/desk`)
      setPendingLevel(null)
    }
  }, [setApiKey, pendingLevel, navigate])

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <TopNav user={user} onSignOut={onSignOut} />

      {/* Map area — clips overflow, centers the map container */}
      <div
        ref={mapAreaRef}
        className="relative flex-1 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {/*
          Map container — JS-computed cover dimensions guarantee the correct
          aspect ratio is maintained regardless of viewport shape.
          This fixes building positions drifting between fullscreen / non-fullscreen.
        */}
        <div
          data-map-container
          className="absolute select-none"
          style={coverSize ? {
            width: coverSize.width,
            height: coverSize.height,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          } : {
            /* Fallback before first measurement */
            aspectRatio: '25134 / 14027',
            minWidth: '100%',
            minHeight: '100%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Map background — fills the container exactly */}
          <img
            src="/assets/map/bg.svg"
            alt="CodeTown 地图"
            className="absolute inset-0 select-none"
            style={{ width: '100%', height: '100%' }}
            draggable={false}
          />

          {/* Buildings */}
          {buildings.map((building) => {
            const pos = positions.find(p => p.level === building.level)!
            return (
              <BuildingCard
                key={building.level}
                level={building.level}
                name={building.name}
                status={building.status}
                style={{
                  left: pos.left,
                  bottom: pos.bottom,
                  width: pos.width,
                }}
                onClick={() => handleBuildingClick(building.level)}
              />
            )
          })}

          {/* Dev position mode overlay */}
          {devMode && (
            <DevPositionMode
              positions={positions}
              onPositionsChange={setPositions}
              onSave={() => {
                localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions))
                toast({ title: '已定稿', description: '建筑位置已保存，刷新页面也不会丢失' })
                setDevMode(false)
              }}
              onReset={() => {
                localStorage.removeItem(POSITIONS_STORAGE_KEY)
                setPositions(DEFAULT_POSITIONS)
                toast({ title: '已重置', description: '已恢复为默认位置' })
              }}
            />
          )}
        </div>
      </div>

      {/* BYOK Modal */}
      <BYOKModal
        open={byokOpen}
        onOpenChange={(open) => {
          setByokOpen(open)
          if (!open) setPendingLevel(null)
        }}
        onKeySubmit={handleKeySubmit}
      />

      {/* Completed building action menu */}
      {completedMenuLevel !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={() => setCompletedMenuLevel(null)}
        >
          <div
            className="flex flex-col gap-3 rounded-xl p-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-modal)',
              minWidth: 240,
            }}
            onClick={e => e.stopPropagation()}
          >
            <p
              className="mb-2 text-center font-bold"
              style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}
            >
              {buildings.find(b => b.level === completedMenuLevel)?.name}
            </p>
            <button
              className="cursor-pointer rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
              }}
              onClick={() => {
                navigate(`/level/${completedMenuLevel}/desk`)
                setCompletedMenuLevel(null)
              }}
            >
              查看项目
            </button>
            <button
              className="cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: 'var(--color-divider)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
              }}
              onClick={() => {
                // Reset the level back to unlocked for rebuild
                completeLevel(completedMenuLevel) // In practice this is a no-op since already completed
                navigate(`/level/${completedMenuLevel}/desk`)
                setCompletedMenuLevel(null)
              }}
            >
              重新建造
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
