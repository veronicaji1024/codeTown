import type { ProjectSpecHook } from '@/hooks/useProjectSpec'

interface BriefCardProps {
  projectSpec: ProjectSpecHook
}

const PROJECT_TYPES = [
  { value: 'website' as const, label: '网站' },
  { value: 'tool' as const, label: '工具' },
  { value: 'game' as const, label: '游戏' },
  { value: 'app' as const, label: '应用' },
]

export default function BriefCard({ projectSpec }: BriefCardProps) {
  const { spec, updateBrief } = projectSpec

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-brief)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-brief)' }}>
        委托单
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <label className="mb-1 block" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            项目名称
          </label>
          <input
            type="text"
            value={spec.brief.text}
            onChange={e => updateBrief(e.target.value, spec.brief.project_type)}
            placeholder="给你的项目起个名字..."
            className="w-full rounded-md border px-2.5 py-1.5 text-sm outline-none focus:ring-1"
            style={{
              borderColor: 'var(--color-divider)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
            }}
          />
        </div>

        <div>
          <label className="mb-1 block" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            项目类型
          </label>
          <div className="flex gap-2">
            {PROJECT_TYPES.map(pt => (
              <button
                key={pt.value}
                onClick={() => updateBrief(spec.brief.text, pt.value)}
                className="rounded-md px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: spec.brief.project_type === pt.value
                    ? 'var(--comp-brief)'
                    : 'var(--bg-base)',
                  color: spec.brief.project_type === pt.value ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color var(--dur-fast)',
                }}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
