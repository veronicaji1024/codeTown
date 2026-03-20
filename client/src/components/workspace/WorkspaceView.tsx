import { useState, useEffect, useCallback, useRef } from 'react'
import { Redirect, useLocation } from 'wouter'
import { useTownState } from '@/hooks/useTownState'
import { useProjectSpec } from '@/hooks/useProjectSpec'
import { useApiKey } from '@/hooks/useApiKey'
import { toast } from '@/hooks/use-toast'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompassTool, RocketLaunch, SpinnerGap, Lock } from '@phosphor-icons/react'
import BYOKModal from '@/components/shared/BYOKModal'
import BlueprintCanvas from './BlueprintCanvas'
import WorkspaceDevMode, { WS_POSITIONS_KEY } from './WorkspaceDevMode'
import type { ElementPosition } from './WorkspaceDevMode'
import { FOLDERS } from './folderConfig'
import type { ComponentType } from '@/hooks/useProjectSpec'

interface WorkspaceViewProps {
  level: string
}

// Default positions for ALL visible SVG elements on the desk
// Finalized positions — folders + labels are independent elements
const DEFAULT_ELEMENTS: ElementPosition[] = [
  // 9 folder icons
  { id: 'folder-brief',            left: '2.3%',      top: '5.7%',       width: '9.1%' },
  { id: 'folder-style',            left: '2.3%',      top: '15.2%',      width: '9.1%' },
  { id: 'folder-requirements',     left: '2.1%',      top: '24.1%',      width: '9.3%' },
  { id: 'folder-team',             left: '2.4%',      top: '34.3%',      width: '9.1%' },
  { id: 'folder-skills',           left: '2.4%',      top: '44.9%',      width: '9.2%' },
  { id: 'folder-rules',            left: '2.4%',      top: '54.9%',      width: '9.2%' },
  { id: 'folder-flow_control',     left: '2.4%',      top: '64.6%',      width: '9.2%' },
  { id: 'folder-plugs',            left: '2.4%',      top: '73.0%',      width: '9.2%' },
  { id: 'folder-library',          left: '2.4%',      top: '82.0%',      width: '9.1%' },
  // 9 folder labels (independent, can be positioned separately)
  { id: 'label-brief',             left: '4.6%',      top: '8.4%',       width: '10%' },
  { id: 'label-style',             left: '3.9%',      top: '18.1%',      width: '10%' },
  { id: 'label-requirements',      left: '4.3%',      top: '27.0%',      width: '10%' },
  { id: 'label-team',              left: '4.2%',      top: '37.5%',      width: '10%' },
  { id: 'label-skills',            left: '5.0%',      top: '47.9%',      width: '10%' },
  { id: 'label-rules',             left: '4.4%',      top: '58.3%',      width: '10%' },
  { id: 'label-flow_control',      left: '4.5%',      top: '67.7%',      width: '10%' },
  { id: 'label-plugs',             left: '5.5%',      top: '76.0%',      width: '10%' },
  { id: 'label-library',           left: '5.1%',      top: '85.3%',      width: '10%' },
  // Decorations & layout
  { id: 'lamp',                    left: '29.1%',     top: '-0.1%',      width: '13.9%' },
  { id: 'blueprint',               left: '31.8%',     top: '13.9%',      width: '50%' },
  { id: 'tabs',                    left: '71.9%',     top: '6.8%',       width: '20%' },
  { id: 'plan-button',             left: '85.6%',     top: '85.0%',      width: '11.0%' },
]

// Map folder element IDs to ComponentType
function folderIdToType(id: string): ComponentType | null {
  // id format is `folder-${ComponentType}`, e.g. `folder-brief`, `folder-requirements`
  const type = id.replace('folder-', '')
  const valid: ComponentType[] = ['brief', 'style', 'requirements', 'team', 'skills', 'rules', 'flow_control', 'plugs', 'library']
  return valid.includes(type as ComponentType) ? (type as ComponentType) : null
}

type Phase = 'design' | 'planning' | 'ready'

export default function WorkspaceView({ level }: WorkspaceViewProps) {
  const [, navigate] = useLocation()
  const { buildings } = useTownState()
  const levelNum = Number(level) as 1 | 2 | 3 | 4
  const building = buildings.find(b => b.level === levelNum)
  const projectSpec = useProjectSpec(levelNum)
  const { apiKey, setApiKey } = useApiKey()
  const [showBYOK, setShowBYOK] = useState(false)
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      const saved = sessionStorage.getItem(`ct_phase_L${level}`)
      if (saved && ['design', 'planning', 'ready'].includes(saved)) return saved as Phase
    } catch { /* ignore */ }
    return 'design'
  })

  // D-mode state
  const [devMode, setDevMode] = useState(false)
  const deskRef = useRef<HTMLDivElement>(null)
  const [elements, setElements] = useState<ElementPosition[]>(() => {
    try {
      const saved = localStorage.getItem(WS_POSITIONS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ElementPosition[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge: use saved positions but fill in any missing elements from defaults
          const merged = DEFAULT_ELEMENTS.map(def => {
            const found = parsed.find(p => p.id === def.id)
            return found ?? def
          })
          return merged
        }
      }
    } catch { /* ignore */ }
    return DEFAULT_ELEMENTS
  })

  // D key toggle
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return
      if (e.key === 'd' || e.key === 'D') setDevMode(prev => !prev)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Helper: get position for an element
  const getPos = useCallback((id: string) => {
    return elements.find(e => e.id === id) ?? DEFAULT_ELEMENTS.find(e => e.id === id)!
  }, [elements])

  // Click folder → fill slot
  const handleFolderClick = useCallback((folderId: string) => {
    if (devMode) return // Don't trigger in dev mode
    const compType = folderIdToType(folderId)
    if (!compType) return

    const folder = FOLDERS.find(f => f.type === compType)
    if (!folder) return
    if (folder.unlockLevel > levelNum) {
      toast({ title: '尚未解锁', description: `第${folder.unlockLevel}关解锁` })
      return
    }

    if (projectSpec.filledSlots[compType]) {
      // Already filled — remove it
      projectSpec.markSlotEmpty(compType)
    } else {
      projectSpec.markSlotFilled(compType)
    }
  }, [devMode, levelNum, projectSpec])

  // Plan / Build button
  async function handlePlan() {
    setPhase('planning')
    sessionStorage.setItem(`ct_phase_L${level}`, 'planning')
    await new Promise(resolve => setTimeout(resolve, 1500))
    setPhase('ready')
    sessionStorage.setItem(`ct_phase_L${level}`, 'ready')
  }

  function handleBuild() {
    if (!apiKey) {
      setShowBYOK(true)
      return
    }
    sessionStorage.setItem('ct_build_spec', JSON.stringify(projectSpec.spec))
    navigate(`/level/${level}/site`)
  }

  // Route guard
  if (!building || building.status === 'locked') {
    return <Redirect to="/" />
  }

  const blueprintPos = getPos('blueprint')

  return (
    <div
      ref={deskRef}
      className="relative h-screen w-screen overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/workspace/desk-wood.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Back link */}
      <a
        href="/"
        className="absolute z-10 font-medium"
        style={{
          top: 8, left: 12,
          color: 'rgba(255,255,255,0.8)',
          fontSize: 'var(--text-sm)',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        ← 返回地图
      </a>

      {/* === Tab Bar === */}
      {(() => {
        const tabPos = getPos('tabs')
        return (
          <div data-ws-id="tabs" className="absolute z-10" style={{ left: tabPos.left, top: tabPos.top, width: tabPos.width }}>
            <Tabs defaultValue="desk">
              <TabsList className="h-9 gap-1" style={{ backgroundColor: 'transparent' }}>
                <TabsTrigger
                  value="desk"
                  className="gap-1.5 px-3 py-1.5 text-sm font-semibold data-[state=active]:text-white data-[state=active]:shadow-none"
                  style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success)', color: '#fff' }}
                >
                  <img src="/assets/workspace/tab-desk.svg" width={16} height={16} alt="" />
                  设计桌
                </TabsTrigger>
                <TabsTrigger
                  value="site"
                  disabled={phase !== 'ready'}
                  onClick={() => phase === 'ready' && navigate(`/level/${level}/site`)}
                  className="gap-1.5 px-3 py-1.5 text-sm font-semibold"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    opacity: phase === 'ready' ? 1 : 0.4,
                    cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
                    backgroundColor: '#fff',
                  }}
                >
                  <img src="/assets/workspace/tab-site.svg" width={16} height={16} alt="" />
                  工地
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )
      })()}

      {/* === 9 Folder Icons (visual only, no click) === */}
      {FOLDERS.map(folder => {
        const pos = getPos(`folder-${folder.type}`)
        const isLocked = folder.unlockLevel > levelNum
        const isFilled = projectSpec.filledSlots[folder.type]

        return (
          <div
            key={`icon-${folder.type}`}
            data-ws-id={`folder-${folder.type}`}
            className="absolute"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <img
              src={folder.icon}
              alt={folder.label}
              className="w-full select-none"
              style={{
                filter: isLocked ? 'grayscale(100%) opacity(0.4)' : isFilled ? 'none' : 'brightness(0.5)',
                transition: 'filter var(--dur-fast)',
              }}
              draggable={false}
            />
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={14} weight="bold" style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
              </div>
            )}
            {isFilled && (
              <div
                className="absolute rounded-full"
                style={{ top: 2, right: 2, width: 10, height: 10, backgroundColor: 'var(--color-success)', border: '2px solid #fff' }}
              />
            )}
          </div>
        )
      })}

      {/* === 9 Folder Labels (clickable, independently positioned, tight fit) === */}
      {FOLDERS.map(folder => {
        const pos = getPos(`label-${folder.type}`)
        const isLocked = folder.unlockLevel > levelNum

        return (
          <div
            key={`label-${folder.type}`}
            data-ws-id={`label-${folder.type}`}
            className="absolute"
            style={{
              left: pos.left,
              top: pos.top,
              zIndex: 6,
              pointerEvents: devMode ? 'none' : 'auto',
            }}
            onClick={() => handleFolderClick(`folder-${folder.type}`)}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#1A1A1A',
                textShadow: '0 1px 3px rgba(255,255,255,0.9)',
                whiteSpace: 'nowrap',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              {folder.label}
            </span>
          </div>
        )
      })}

      {/* === Lamp === */}
      {(() => {
        const pos = getPos('lamp')
        return (
          <img
            data-ws-id="lamp"
            src="/assets/workspace/lamp.svg"
            alt=""
            className="pointer-events-none absolute select-none"
            style={{ left: pos.left, top: pos.top, width: pos.width, zIndex: 3 }}
            draggable={false}
          />
        )
      })()}


      {/* === Blueprint Paper === */}
      <div
        data-ws-id="blueprint"
        className="absolute flex flex-col overflow-hidden"
        style={{
          left: blueprintPos.left,
          top: blueprintPos.top,
          width: blueprintPos.width,
          aspectRatio: '3 / 4',
          backgroundImage: 'url(/assets/workspace/blueprint-paper.svg)',
          backgroundSize: 'cover',
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '4px 4px 12px rgba(0,0,0,0.15)',
          zIndex: 4,
        }}
      >
        <BlueprintCanvas level={levelNum} projectSpec={projectSpec} />
      </div>

      {/* === Plan / Build Button === */}
      {(() => {
        const pos = getPos('plan-button')
        return (
          <div data-ws-id="plan-button" className="absolute z-10" style={{ left: pos.left, top: pos.top, width: pos.width }}>
            {phase === 'design' && (
              <button
                onClick={handlePlan}
                disabled={!projectSpec.isAllRequiredFilled}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold shadow-lg"
                style={{
                  backgroundColor: projectSpec.isAllRequiredFilled ? 'var(--color-primary)' : 'var(--color-locked)',
                  color: '#fff',
                  border: 'none',
                  cursor: projectSpec.isAllRequiredFilled ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <CompassTool size={18} weight="duotone" />
                制定工作计划
              </button>
            )}
            {phase === 'planning' && (
              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold shadow-lg"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  opacity: 0.8,
                  fontSize: 'var(--text-sm)',
                }}
              >
                <SpinnerGap size={18} weight="bold" className="animate-spin" />
                规划中...
              </button>
            )}
            {phase === 'ready' && (
              <button
                onClick={handleBuild}
                className="animate-bounce-in flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold shadow-lg"
                style={{
                  backgroundColor: 'var(--color-success)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <RocketLaunch size={18} weight="duotone" />
                开始建造
              </button>
            )}
          </div>
        )
      })()}

      {/* === Dev Mode Overlay === */}
      {devMode && (
        <WorkspaceDevMode
          elements={elements}
          onElementsChange={setElements}
          containerRef={deskRef}
          onSave={() => {
            localStorage.setItem(WS_POSITIONS_KEY, JSON.stringify(elements))
            toast({ title: '已写入源码', description: 'DEFAULT_ELEMENTS 已更新至 WorkspaceView.tsx' })
            setDevMode(false)
          }}
          onReset={() => {
            localStorage.removeItem(WS_POSITIONS_KEY)
            setElements(DEFAULT_ELEMENTS)
            toast({ title: '已重置', description: '已恢复为默认位置' })
          }}
        />
      )}

      {/* BYOK Modal */}
      <BYOKModal
        open={showBYOK}
        onOpenChange={setShowBYOK}
        onKeySubmit={key => {
          setApiKey(key)
          setShowBYOK(false)
          sessionStorage.setItem('ct_build_spec', JSON.stringify(projectSpec.spec))
          navigate(`/level/${level}/site`)
        }}
      />
    </div>
  )
}
