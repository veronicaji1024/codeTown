import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getSlotsForLevel } from '@/hooks/useProjectSpec'
import type { ProjectSpecHook, ComponentType } from '@/hooks/useProjectSpec'
import CardSlot from './CardSlot'
import BriefCard from './cards/BriefCard'
import StyleCard from './cards/StyleCard'
import RequirementsCard from './cards/RequirementsCard'
import AgentTeamCard from './cards/AgentTeamCard'
import SkillsCard from './cards/SkillsCard'
import RulesCard from './cards/RulesCard'
import FlowControlCard from './cards/FlowControlCard'
import PlugCard from './cards/PlugCard'
import LibraryCard from './cards/LibraryCard'

interface BlueprintCanvasProps {
  level: 1 | 2 | 3 | 4
  projectSpec: ProjectSpecHook
}

function renderCardContent(type: ComponentType, level: number, projectSpec: ProjectSpecHook) {
  switch (type) {
    case 'brief':
      return <BriefCard projectSpec={projectSpec} />
    case 'style':
      return <StyleCard projectSpec={projectSpec} />
    case 'requirements':
      return <RequirementsCard level={level} projectSpec={projectSpec} />
    case 'team':
      return <AgentTeamCard level={level} projectSpec={projectSpec} />
    case 'skills':
      return <SkillsCard projectSpec={projectSpec} />
    case 'rules':
      return <RulesCard projectSpec={projectSpec} />
    case 'flow_control':
      return <FlowControlCard projectSpec={projectSpec} />
    case 'plugs':
      return <PlugCard level={level} projectSpec={projectSpec} />
    case 'library':
      return <LibraryCard projectSpec={projectSpec} />
  }
}

export default function BlueprintCanvas({ level, projectSpec }: BlueprintCanvasProps) {
  const slots = useMemo(() => getSlotsForLevel(level), [level])
  const filledCount = slots.filter(s => s.status !== 'locked' && projectSpec.filledSlots[s.type]).length
  const totalCount = slots.filter(s => s.status !== 'locked').length

  return (
    <div className="flex h-full flex-col">
      {/* Summary bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      >
        <span className="font-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
          {projectSpec.spec.brief.text || '未命名项目'}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>·</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
          {projectSpec.spec.brief.project_type}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '10px', marginLeft: 'auto' }}>
          已填 {filledCount}/{totalCount}
        </span>
      </div>

      {/* Slots area */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {slots.map(slot => (
            <CardSlot
              key={slot.type}
              slot={slot}
              isFilled={projectSpec.filledSlots[slot.type]}
              onRemove={() => projectSpec.markSlotEmpty(slot.type)}
            >
              {projectSpec.filledSlots[slot.type] && renderCardContent(slot.type, level, projectSpec)}
            </CardSlot>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
