import { useState, useCallback, useMemo } from 'react'
import type {
  ProjectSpec,
  Requirement,
  AgentConfig,
  SpecSkill,
  SpecRule,
  FlowInstruction,
  Plug,
  LibraryItem,
} from '@codetown/shared'

// Component types matching the 9 folders
export type ComponentType =
  | 'brief'
  | 'style'
  | 'requirements'
  | 'team'
  | 'skills'
  | 'rules'
  | 'flow_control'
  | 'plugs'
  | 'library'

// Which slots are filled
export type FilledSlots = Record<ComponentType, boolean>

// Return type for the hook
export interface ProjectSpecHook {
  spec: ProjectSpec
  filledSlots: FilledSlots
  isAllRequiredFilled: boolean
  // Updaters
  updateBrief: (text: string, projectType: ProjectSpec['brief']['project_type']) => void
  updateStyle: (preset: string | null, description: string, personality: string) => void
  addRequirement: (req: Requirement) => void
  removeRequirement: (id: string) => void
  updateRequirement: (id: string, partial: Partial<Requirement>) => void
  updateTeam: (agents: AgentConfig[]) => void
  addSkill: (skill: SpecSkill) => void
  removeSkill: (id: string) => void
  addRule: (rule: SpecRule) => void
  removeRule: (id: string) => void
  addFlowInstruction: (instruction: FlowInstruction) => void
  removeFlowInstruction: (id: string) => void
  addPlug: (plug: Plug) => void
  removePlug: (id: string) => void
  addLibraryItem: (item: LibraryItem) => void
  removeLibraryItem: (id: string) => void
  // Mark slots as filled (used by DnD)
  markSlotFilled: (type: ComponentType) => void
  markSlotEmpty: (type: ComponentType) => void
}

const DEFAULT_AGENTS: AgentConfig[] = [
  { type: 'planner', enabled: true, project_based_prompt: '' },
  { type: 'builder', enabled: true, project_based_prompt: '' },
  { type: 'tester', enabled: true, project_based_prompt: '' },
  { type: 'reviewer', enabled: true, project_based_prompt: '' },
]

function createEmptySpec(level: 1 | 2 | 3 | 4): ProjectSpec {
  return {
    level,
    brief: { text: '', project_type: 'website' },
    style: { visual_preset: null, visual_description: '', personality: '' },
    requirements: [],
    team: { agents: [...DEFAULT_AGENTS] },
    skills: [],
    rules: [],
    flow_control: [],
    plugs: [],
    library: [],
  }
}

function createL1Template(): ProjectSpec {
  return {
    level: 1,
    brief: { text: '面包店新品展示页', project_type: 'website' },
    style: { visual_preset: '温馨手绘', visual_description: '', personality: '' },
    requirements: [
      { id: 'r1', type: 'feature', text: '展示每日新品面包，包含名称、图片和价格' },
      { id: 'r2', type: 'feature', text: '顾客可以点击"我想要"按钮收藏喜欢的面包' },
      { id: 'r3', type: 'feature', text: '页面顶部展示面包店名称和欢迎语' },
    ],
    team: { agents: [...DEFAULT_AGENTS] },
    skills: [],
    rules: [],
    flow_control: [],
    plugs: [],
    library: [],
  }
}

// Slot configuration per level
export interface SlotConfig {
  type: ComponentType
  label: string
  status: 'required' | 'optional' | 'locked'
  unlockLevel: number
}

export function getSlotsForLevel(level: 1 | 2 | 3 | 4): SlotConfig[] {
  const allSlots: SlotConfig[] = [
    { type: 'brief', label: '委托单', status: 'required', unlockLevel: 1 },
    { type: 'style', label: '装修方案', status: 'required', unlockLevel: 1 },
    { type: 'requirements', label: '需求清单', status: 'required', unlockLevel: 1 },
    { type: 'team', label: '工匠团队', status: 'optional', unlockLevel: 3 },
    { type: 'skills', label: '技能包', status: 'optional', unlockLevel: 3 },
    { type: 'rules', label: '规则系统', status: 'optional', unlockLevel: 3 },
    { type: 'flow_control', label: '流程控制', status: 'optional', unlockLevel: 3 },
    { type: 'plugs', label: 'Plug', status: 'optional', unlockLevel: 3 },
    { type: 'library', label: '图书馆', status: 'optional', unlockLevel: 4 },
  ]

  return allSlots.map(slot => ({
    ...slot,
    status: slot.unlockLevel > level ? 'locked' : slot.status,
  }))
}

const SPEC_STORAGE_KEY = (lvl: number) => `ct_project_spec_L${lvl}`
const SLOTS_STORAGE_KEY = (lvl: number) => `ct_filled_slots_L${lvl}`

const EMPTY_SLOTS: FilledSlots = {
  brief: false,
  style: false,
  requirements: false,
  team: false,
  skills: false,
  rules: false,
  flow_control: false,
  plugs: false,
  library: false,
}

export function useProjectSpec(level: 1 | 2 | 3 | 4): ProjectSpecHook {
  const [spec, setSpecRaw] = useState<ProjectSpec>(() => {
    try {
      const saved = localStorage.getItem(SPEC_STORAGE_KEY(level))
      if (saved) return JSON.parse(saved) as ProjectSpec
    } catch { /* ignore */ }
    return level === 1 ? createL1Template() : createEmptySpec(level)
  })

  const [filledSlots, setFilledSlotsRaw] = useState<FilledSlots>(() => {
    try {
      const saved = localStorage.getItem(SLOTS_STORAGE_KEY(level))
      if (saved) return JSON.parse(saved) as FilledSlots
    } catch { /* ignore */ }
    return { ...EMPTY_SLOTS }
  })

  // Wrap setters to persist to localStorage
  const setSpec: typeof setSpecRaw = useCallback((action) => {
    setSpecRaw(prev => {
      const next = typeof action === 'function' ? action(prev) : action
      localStorage.setItem(SPEC_STORAGE_KEY(level), JSON.stringify(next))
      return next
    })
  }, [level])

  const setFilledSlots: typeof setFilledSlotsRaw = useCallback((action) => {
    setFilledSlotsRaw(prev => {
      const next = typeof action === 'function' ? action(prev) : action
      localStorage.setItem(SLOTS_STORAGE_KEY(level), JSON.stringify(next))
      return next
    })
  }, [level])

  const slots = useMemo(() => getSlotsForLevel(level), [level])

  const isAllRequiredFilled = useMemo(() => {
    return slots
      .filter(s => s.status === 'required')
      .every(s => filledSlots[s.type])
  }, [slots, filledSlots])

  const updateBrief = useCallback((text: string, projectType: ProjectSpec['brief']['project_type']) => {
    setSpec(prev => ({ ...prev, brief: { text, project_type: projectType } }))
  }, [])

  const updateStyle = useCallback((preset: string | null, description: string, personality: string) => {
    setSpec(prev => ({
      ...prev,
      style: { visual_preset: preset, visual_description: description, personality },
    }))
  }, [])

  const addRequirement = useCallback((req: Requirement) => {
    setSpec(prev => ({ ...prev, requirements: [...prev.requirements, req] }))
  }, [])

  const removeRequirement = useCallback((id: string) => {
    setSpec(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r.id !== id),
    }))
  }, [])

  const updateRequirement = useCallback((id: string, partial: Partial<Requirement>) => {
    setSpec(prev => ({
      ...prev,
      requirements: prev.requirements.map(r =>
        r.id === id ? { ...r, ...partial } : r
      ),
    }))
  }, [])

  const updateTeam = useCallback((agents: AgentConfig[]) => {
    setSpec(prev => ({ ...prev, team: { agents } }))
  }, [])

  const addSkill = useCallback((skill: SpecSkill) => {
    setSpec(prev => ({ ...prev, skills: [...prev.skills, skill] }))
  }, [])

  const removeSkill = useCallback((id: string) => {
    setSpec(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.skill_id !== id),
    }))
  }, [])

  const addRule = useCallback((rule: SpecRule) => {
    setSpec(prev => ({ ...prev, rules: [...prev.rules, rule] }))
  }, [])

  const removeRule = useCallback((id: string) => {
    setSpec(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.rule_id !== id),
    }))
  }, [])

  const addFlowInstruction = useCallback((instruction: FlowInstruction) => {
    setSpec(prev => ({
      ...prev,
      flow_control: [...prev.flow_control, instruction],
    }))
  }, [])

  const removeFlowInstruction = useCallback((id: string) => {
    setSpec(prev => ({
      ...prev,
      flow_control: prev.flow_control.filter(f => f.id !== id),
    }))
  }, [])

  const addPlug = useCallback((plug: Plug) => {
    setSpec(prev => ({ ...prev, plugs: [...prev.plugs, plug] }))
  }, [])

  const removePlug = useCallback((id: string) => {
    setSpec(prev => ({
      ...prev,
      plugs: prev.plugs.filter(p => p.id !== id),
    }))
  }, [])

  const addLibraryItem = useCallback((item: LibraryItem) => {
    setSpec(prev => ({ ...prev, library: [...prev.library, item] }))
  }, [])

  const removeLibraryItem = useCallback((id: string) => {
    setSpec(prev => ({
      ...prev,
      library: prev.library.filter(l => l.ref_id !== id),
    }))
  }, [])

  const markSlotFilled = useCallback((type: ComponentType) => {
    setFilledSlots(prev => ({ ...prev, [type]: true }))
  }, [])

  const markSlotEmpty = useCallback((type: ComponentType) => {
    setFilledSlots(prev => ({ ...prev, [type]: false }))
  }, [])

  return {
    spec,
    filledSlots,
    isAllRequiredFilled,
    updateBrief,
    updateStyle,
    addRequirement,
    removeRequirement,
    updateRequirement,
    updateTeam,
    addSkill,
    removeSkill,
    addRule,
    removeRule,
    addFlowInstruction,
    removeFlowInstruction,
    addPlug,
    removePlug,
    addLibraryItem,
    removeLibraryItem,
    markSlotFilled,
    markSlotEmpty,
  }
}
