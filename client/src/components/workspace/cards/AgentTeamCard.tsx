import type { ProjectSpecHook } from '@/hooks/useProjectSpec'
import type { AgentConfig } from '@codetown/shared'

interface AgentTeamCardProps {
  level: number
  projectSpec: ProjectSpecHook
}

const AGENT_LABELS: Record<AgentConfig['type'], string> = {
  planner: '规划者',
  builder: '建造者',
  tester: '测试者',
  reviewer: '审查者',
}

const AGENT_EMOJIS: Record<AgentConfig['type'], string> = {
  planner: '📐',
  builder: '🔨',
  tester: '🧪',
  reviewer: '🔍',
}

export default function AgentTeamCard({ level, projectSpec }: AgentTeamCardProps) {
  const { spec, updateTeam } = projectSpec
  const agents = spec.team.agents

  function toggleAgent(type: AgentConfig['type']) {
    if (level < 2) return // L1: fixed, not editable
    const updated = agents.map(a =>
      a.type === type ? { ...a, enabled: !a.enabled } : a
    )
    updateTeam(updated)
  }

  function updatePrompt(type: AgentConfig['type'], prompt: string) {
    const updated = agents.map(a =>
      a.type === type ? { ...a, project_based_prompt: prompt } : a
    )
    updateTeam(updated)
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-agent)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-agent)' }}>
        工匠团队
      </div>

      <div className="flex flex-col gap-2">
        {agents.map(agent => (
          <div
            key={agent.type}
            className="rounded-md p-2"
            style={{
              backgroundColor: agent.enabled ? 'var(--bg-base)' : 'transparent',
              opacity: agent.enabled ? 1 : 0.5,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>{AGENT_EMOJIS[agent.type]}</span>
              <span
                className="flex-1 font-medium"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
              >
                {AGENT_LABELS[agent.type]}
              </span>
              {level >= 2 && (
                <button
                  onClick={() => toggleAgent(agent.type)}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: agent.enabled ? 'var(--color-success)' : 'var(--color-locked)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {agent.enabled ? '启用' : '关闭'}
                </button>
              )}
            </div>
            {level >= 3 && agent.enabled && (
              <textarea
                value={agent.project_based_prompt}
                onChange={e => updatePrompt(agent.type, e.target.value)}
                placeholder="自定义指令（可选）..."
                rows={2}
                className="mt-1.5 w-full resize-none rounded border px-2 py-1 text-xs outline-none"
                style={{
                  borderColor: 'var(--color-divider)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
