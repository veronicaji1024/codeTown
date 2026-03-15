import type { ComponentType } from '@/hooks/useProjectSpec'

export interface FolderConfig {
  type: ComponentType
  label: string
  icon: string // SVG path in /assets/workspace/
  colorVar: string // CSS variable for the component color
  unlockLevel: number
}

export const FOLDERS: FolderConfig[] = [
  { type: 'brief', label: '委托单', icon: '/assets/workspace/folder-brief.svg', colorVar: '--comp-brief', unlockLevel: 1 },
  { type: 'style', label: '装修方案', icon: '/assets/workspace/folder-style.svg', colorVar: '--comp-style', unlockLevel: 1 },
  { type: 'requirements', label: '需求清单', icon: '/assets/workspace/folder-req.svg', colorVar: '--comp-req', unlockLevel: 1 },
  { type: 'team', label: '工匠团队', icon: '/assets/workspace/folder-agent.svg', colorVar: '--comp-agent', unlockLevel: 1 },
  { type: 'skills', label: '技能包', icon: '/assets/workspace/folder-skill.svg', colorVar: '--comp-skill', unlockLevel: 3 },
  { type: 'rules', label: '规则系统', icon: '/assets/workspace/folder-rule.svg', colorVar: '--comp-rule', unlockLevel: 3 },
  { type: 'flow_control', label: '流程控制', icon: '/assets/workspace/folder-flow.svg', colorVar: '--comp-flow', unlockLevel: 3 },
  { type: 'plugs', label: 'Plug', icon: '/assets/workspace/folder-plug.svg', colorVar: '--comp-plug', unlockLevel: 3 },
  { type: 'library', label: '图书馆', icon: '/assets/workspace/folder-library.svg', colorVar: '--comp-library', unlockLevel: 4 },
]
