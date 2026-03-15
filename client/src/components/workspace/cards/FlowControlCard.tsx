import { Trash } from '@phosphor-icons/react'
import type { ProjectSpecHook } from '@/hooks/useProjectSpec'
import type { FlowInstruction } from '@codetown/shared'

interface FlowControlCardProps {
  projectSpec: ProjectSpecHook
}

const INSTRUCTION_TYPES: { value: FlowInstruction['instruction_type']; label: string; desc: string }[] = [
  { value: 'sequence', label: '先后执行', desc: '按顺序依次完成任务' },
  { value: 'parallel', label: '同时执行', desc: '多个任务并行处理' },
  { value: 'iterate', label: '持续改进', desc: '反复迭代直到满意' },
  { value: 'checkpoint', label: '让我看看', desc: '完成后暂停等待审查' },
]

let flowCounter = 0

export default function FlowControlCard({ projectSpec }: FlowControlCardProps) {
  const { spec, addFlowInstruction, removeFlowInstruction } = projectSpec

  function handleAdd(type: FlowInstruction['instruction_type']) {
    addFlowInstruction({
      id: `flow-${Date.now()}-${flowCounter++}`,
      instruction_type: type,
      task_refs: [],
    })
  }

  function updateTaskRefs(id: string, refs: string[]) {
    const existing = spec.flow_control.find(f => f.id === id)
    if (!existing) return
    removeFlowInstruction(id)
    addFlowInstruction({ ...existing, task_refs: refs })
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-flow)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-flow)' }}>
        流程控制
      </div>

      <div className="flex flex-col gap-2">
        {spec.flow_control.map(instruction => {
          const typeInfo = INSTRUCTION_TYPES.find(t => t.value === instruction.instruction_type)
          return (
            <div
              key={instruction.id}
              className="rounded-md p-2"
              style={{ backgroundColor: 'var(--bg-base)', fontSize: 'var(--text-sm)' }}
            >
              <div className="flex items-center gap-2">
                <select
                  value={instruction.instruction_type}
                  onChange={e => {
                    removeFlowInstruction(instruction.id)
                    addFlowInstruction({
                      ...instruction,
                      instruction_type: e.target.value as FlowInstruction['instruction_type'],
                    })
                  }}
                  className="rounded border px-2 py-0.5 text-sm font-medium outline-none"
                  style={{ borderColor: 'var(--color-divider)', color: 'var(--comp-flow)' }}
                >
                  {INSTRUCTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {typeInfo?.desc}
                </span>
                <button
                  onClick={() => removeFlowInstruction(instruction.id)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Trash size={14} style={{ color: 'var(--color-error)' }} />
                </button>
              </div>

              {/* Task refs */}
              <div className="mt-1.5 flex flex-col gap-1">
                {instruction.task_refs.map((ref, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)', width: 16 }}>{i + 1}.</span>
                    <input
                      type="text"
                      value={ref}
                      onChange={e => {
                        const newRefs = [...instruction.task_refs]
                        newRefs[i] = e.target.value
                        updateTaskRefs(instruction.id, newRefs)
                      }}
                      placeholder="任务描述..."
                      className="flex-1 rounded border px-2 py-0.5 text-xs outline-none"
                      style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => {
                        const newRefs = instruction.task_refs.filter((_, j) => j !== i)
                        updateTaskRefs(instruction.id, newRefs)
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash size={12} style={{ color: 'var(--color-error)' }} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateTaskRefs(instruction.id, [...instruction.task_refs, ''])}
                  className="text-xs"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--comp-flow)', textAlign: 'left' }}
                >
                  + 添加任务
                </button>
              </div>
            </div>
          )
        })}

        <div className="flex flex-wrap gap-1.5">
          {INSTRUCTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => handleAdd(t.value)}
              className="rounded-md px-2 py-1 text-xs"
              style={{
                border: '1px dashed var(--color-divider)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
