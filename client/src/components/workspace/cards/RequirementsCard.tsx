import { Plus, Trash } from '@phosphor-icons/react'
import type { ProjectSpecHook } from '@/hooks/useProjectSpec'
import type { Requirement } from '@codetown/shared'

interface RequirementsCardProps {
  level: number
  projectSpec: ProjectSpecHook
}

const REQ_TYPES: { value: Requirement['type']; label: string; unlockLevel: number }[] = [
  { value: 'feature', label: '功能需求', unlockLevel: 1 },
  { value: 'constraint', label: '约束条件', unlockLevel: 2 },
  { value: 'when_then', label: '当...则...', unlockLevel: 2 },
  { value: 'data', label: '数据需求', unlockLevel: 4 },
]

let reqIdCounter = 100

export default function RequirementsCard({ level, projectSpec }: RequirementsCardProps) {
  const { spec, addRequirement, removeRequirement, updateRequirement } = projectSpec
  const availableTypes = REQ_TYPES.filter(t => t.unlockLevel <= level)

  function handleAdd(type: Requirement['type']) {
    const id = `req-${Date.now()}-${reqIdCounter++}`
    if (type === 'when_then') {
      addRequirement({ id, type, text: '', when: '', then: '' })
    } else {
      addRequirement({ id, type, text: '' })
    }
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-req)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-req)' }}>
        需求清单
      </div>

      <div className="flex flex-col gap-2">
        {spec.requirements.map(req => (
          <div
            key={req.id}
            className="flex items-start gap-2 rounded-md p-2"
            style={{ backgroundColor: 'var(--bg-base)', fontSize: 'var(--text-sm)' }}
          >
            <span
              className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--comp-req)', color: '#fff' }}
            >
              {REQ_TYPES.find(t => t.value === req.type)?.label ?? req.type}
            </span>

            <div className="flex flex-1 flex-col gap-1">
              {req.type === 'when_then' ? (
                <>
                  <input
                    type="text"
                    value={req.when ?? ''}
                    onChange={e => updateRequirement(req.id, { when: e.target.value })}
                    placeholder="当..."
                    className="w-full rounded border px-2 py-1 text-sm outline-none"
                    style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    value={req.then ?? ''}
                    onChange={e => updateRequirement(req.id, { then: e.target.value })}
                    placeholder="则..."
                    className="w-full rounded border px-2 py-1 text-sm outline-none"
                    style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
                  />
                </>
              ) : (
                <input
                  type="text"
                  value={req.text}
                  onChange={e => updateRequirement(req.id, { text: e.target.value })}
                  placeholder="描述需求..."
                  className="w-full rounded border px-2 py-1 text-sm outline-none"
                  style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
                />
              )}
            </div>

            <button
              onClick={() => removeRequirement(req.id)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Trash size={14} style={{ color: 'var(--color-error)' }} />
            </button>
          </div>
        ))}

        {/* Add buttons */}
        <div className="flex flex-wrap gap-1.5">
          {availableTypes.map(t => (
            <button
              key={t.value}
              onClick={() => handleAdd(t.value)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              style={{
                border: '1px dashed var(--color-divider)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Plus size={12} weight="bold" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
