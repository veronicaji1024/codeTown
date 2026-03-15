import type { ProjectSpecHook } from '@/hooks/useProjectSpec'

interface StyleCardProps {
  projectSpec: ProjectSpecHook
}

const PRESETS = [
  { id: 'warm-hand', label: '温馨手绘', emoji: '🎨', bg: '#FFF3E0' },
  { id: 'tech', label: '科技感', emoji: '💻', bg: '#E3F2FD' },
  { id: 'minimal', label: '简约白', emoji: '⬜', bg: '#FAFAFA' },
  { id: 'dark-cool', label: '深色炫酷', emoji: '🌙', bg: '#263238' },
]

export default function StyleCard({ projectSpec }: StyleCardProps) {
  const { spec, updateStyle } = projectSpec

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-style)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-style)' }}>
        装修方案
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <label className="mb-1 block" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            视觉风格
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => updateStyle(p.id, spec.style.visual_description, spec.style.personality)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left"
                style={{
                  backgroundColor: p.bg,
                  border: spec.style.visual_preset === p.id
                    ? '2px solid var(--comp-style)'
                    : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  color: p.id === 'dark-cool' ? '#fff' : 'var(--text-primary)',
                  fontWeight: spec.style.visual_preset === p.id ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 16 }}>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            性格描述（可选）
          </label>
          <textarea
            value={spec.style.personality}
            onChange={e => updateStyle(spec.style.visual_preset, spec.style.visual_description, e.target.value)}
            placeholder="描述你想要的风格个性..."
            rows={2}
            className="w-full resize-none rounded-md border px-2.5 py-1.5 text-sm outline-none focus:ring-1"
            style={{
              borderColor: 'var(--color-divider)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
