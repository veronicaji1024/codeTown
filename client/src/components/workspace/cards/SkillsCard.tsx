import { Plus, Trash } from '@phosphor-icons/react'
import type { ProjectSpecHook } from '@/hooks/useProjectSpec'
import type { SpecSkill } from '@codetown/shared'

interface SkillsCardProps {
  projectSpec: ProjectSpecHook
}

const BUILTIN_TEMPLATES: { name: string; content: string }[] = [
  { name: '响应式布局', content: '确保页面在手机、平板和桌面都能正常显示' },
  { name: '无障碍访问', content: '使用语义化 HTML 和 ARIA 属性，确保屏幕阅读器可访问' },
  { name: '动画效果', content: '为关键交互添加流畅的 CSS 过渡动画' },
  { name: '表单验证', content: '对所有用户输入进行前端验证，给出清晰的错误提示' },
  { name: '性能优化', content: '图片懒加载、代码分割、减少不必要的重渲染' },
]

const TARGETS: SpecSkill['target_agent'][] = ['builder', 'tester', 'reviewer', 'all']
const TARGET_LABELS: Record<SpecSkill['target_agent'], string> = {
  builder: '建造者',
  tester: '测试者',
  reviewer: '审查者',
  all: '全部',
}

let skillCounter = 0

export default function SkillsCard({ projectSpec }: SkillsCardProps) {
  const { spec, addSkill, removeSkill } = projectSpec

  function handleAdd(name: string, content: string) {
    addSkill({
      skill_id: `skill-${Date.now()}-${skillCounter++}`,
      name,
      target_agent: 'builder',
      content,
    })
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-skill)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-skill)' }}>
        技能包
      </div>

      <div className="flex flex-col gap-2">
        {spec.skills.map(skill => (
          <div
            key={skill.skill_id}
            className="rounded-md p-2"
            style={{ backgroundColor: 'var(--bg-base)', fontSize: 'var(--text-sm)' }}
          >
            <div className="flex items-center gap-2">
              <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                {skill.name}
              </span>
              <select
                value={skill.target_agent}
                onChange={e => {
                  removeSkill(skill.skill_id)
                  addSkill({ ...skill, target_agent: e.target.value as SpecSkill['target_agent'] })
                }}
                className="rounded border px-1.5 py-0.5 text-xs outline-none"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--text-secondary)' }}
              >
                {TARGETS.map(t => (
                  <option key={t} value={t}>{TARGET_LABELS[t]}</option>
                ))}
              </select>
              <button
                onClick={() => removeSkill(skill.skill_id)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Trash size={14} style={{ color: 'var(--color-error)' }} />
              </button>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {skill.content}
            </p>
          </div>
        ))}

        {/* Quick templates */}
        <div className="flex flex-wrap gap-1.5">
          {BUILTIN_TEMPLATES.map(t => (
            <button
              key={t.name}
              onClick={() => handleAdd(t.name, t.content)}
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
          onClick={() => handleAdd('', '')}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          style={{
            border: '1px dashed var(--comp-skill)',
            backgroundColor: 'transparent',
            color: 'var(--comp-skill)',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} weight="bold" />
          自定义技能
        </button>
      </div>
    </div>
  )
}
