import { Plus, Trash } from '@phosphor-icons/react'
import type { ProjectSpecHook } from '@/hooks/useProjectSpec'
import type { SpecRule } from '@codetown/shared'

interface RulesCardProps {
  projectSpec: ProjectSpecHook
}

const TRIGGER_TYPES: { value: SpecRule['trigger_type']; label: string }[] = [
  { value: 'on_task_done', label: '任务完成时' },
  { value: 'on_test_fail', label: '测试失败时' },
  { value: 'before_deploy', label: '部署前' },
]

const BUILTIN_TEMPLATES: { name: string; trigger: SpecRule['trigger_type']; content: string }[] = [
  { name: '代码检查', trigger: 'on_task_done', content: '每次任务完成后检查代码是否符合项目规范' },
  { name: '自动修复', trigger: 'on_test_fail', content: '测试失败时自动尝试修复并重新运行测试' },
  { name: '最终审查', trigger: 'before_deploy', content: '部署前检查所有文件是否完整，无遗漏功能' },
]

let ruleCounter = 0

export default function RulesCard({ projectSpec }: RulesCardProps) {
  const { spec, addRule, removeRule } = projectSpec

  function handleAdd(name: string, trigger: SpecRule['trigger_type'], content: string) {
    addRule({
      rule_id: `rule-${Date.now()}-${ruleCounter++}`,
      name,
      trigger_type: trigger,
      content,
    })
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-rule)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-rule)' }}>
        规则系统
      </div>

      <div className="flex flex-col gap-2">
        {spec.rules.map(rule => (
          <div
            key={rule.rule_id}
            className="rounded-md p-2"
            style={{ backgroundColor: 'var(--bg-base)', fontSize: 'var(--text-sm)' }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rule.name}
                onChange={e => {
                  removeRule(rule.rule_id)
                  addRule({ ...rule, name: e.target.value })
                }}
                placeholder="规则名称..."
                className="flex-1 rounded border px-2 py-0.5 text-sm outline-none"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
              />
              <select
                value={rule.trigger_type}
                onChange={e => {
                  removeRule(rule.rule_id)
                  addRule({ ...rule, trigger_type: e.target.value as SpecRule['trigger_type'] })
                }}
                className="rounded border px-1.5 py-0.5 text-xs outline-none"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--text-secondary)' }}
              >
                {TRIGGER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button
                onClick={() => removeRule(rule.rule_id)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Trash size={14} style={{ color: 'var(--color-error)' }} />
              </button>
            </div>
            <textarea
              value={rule.content}
              onChange={e => {
                removeRule(rule.rule_id)
                addRule({ ...rule, content: e.target.value })
              }}
              placeholder="规则内容..."
              rows={2}
              className="mt-1.5 w-full resize-none rounded border px-2 py-1 text-xs outline-none"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
            />
          </div>
        ))}

        <div className="flex flex-wrap gap-1.5">
          {BUILTIN_TEMPLATES.map(t => (
            <button
              key={t.name}
              onClick={() => handleAdd(t.name, t.trigger, t.content)}
              className="rounded-md px-2 py-1 text-xs"
              style={{
                border: '1px dashed var(--color-divider)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              + {t.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleAdd('', 'on_task_done', '')}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          style={{
            border: '1px dashed var(--comp-rule)',
            backgroundColor: 'transparent',
            color: 'var(--comp-rule)',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} weight="bold" />
          自定义规则
        </button>
      </div>
    </div>
  )
}
