import { useState, useCallback } from 'react'

export type BuildingStatus = 'locked' | 'unlocked' | 'completed'

export interface Building {
  level: 1 | 2 | 3 | 4
  name: string
  status: BuildingStatus
}

const STORAGE_KEY = 'ct_town_state'

const BUILDING_NAMES: Record<number, string> = {
  1: '面包店',
  2: '游戏厅',
  3: '我的家',
  4: '新闻看板',
}

function getInitialState(): BuildingStatus[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as BuildingStatus[]
      if (Array.isArray(parsed) && parsed.length === 4) return parsed
    }
  } catch { /* ignore */ }
  return ['unlocked', 'locked', 'locked', 'locked']
}

function persist(statuses: BuildingStatus[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
}

export function useTownState() {
  const [statuses, setStatuses] = useState<BuildingStatus[]>(getInitialState)

  const buildings: Building[] = statuses.map((status, i) => ({
    level: (i + 1) as 1 | 2 | 3 | 4,
    name: BUILDING_NAMES[i + 1],
    status,
  }))

  const completeLevel = useCallback((level: number) => {
    setStatuses(prev => {
      const next = [...prev]
      next[level - 1] = 'completed'
      // unlock the next level if it exists and is locked
      if (level < 4 && next[level] === 'locked') {
        next[level] = 'unlocked'
      }
      persist(next)
      return next
    })
  }, [])

  const unlockNext = useCallback(() => {
    setStatuses(prev => {
      const idx = prev.findIndex(s => s === 'locked')
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = 'unlocked'
      persist(next)
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    const fresh: BuildingStatus[] = ['unlocked', 'locked', 'locked', 'locked']
    persist(fresh)
    setStatuses(fresh)
  }, [])

  return { buildings, completeLevel, unlockNext, resetAll }
}
