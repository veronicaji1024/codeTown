import type { ProjectSpec } from '@codetown/shared'

/**
 * MetaPlanner — 纯逻辑服务，规范化 ProjectSpec
 * 不调用 AI，只做排序和补全
 */
export function normalizeSpec(spec: ProjectSpec): ProjectSpec {
  const normalized = { ...spec }

  // 1. requirements 按 type 排序：feature > constraint > when_then > data
  const typeOrder: Record<string, number> = {
    feature: 0,
    constraint: 1,
    when_then: 2,
    data: 3,
  }
  normalized.requirements = [...spec.requirements].sort(
    (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99),
  )

  // 2. skills 按 target_agent 分组排序：all > builder > tester > reviewer
  const agentOrder: Record<string, number> = {
    all: 0,
    builder: 1,
    tester: 2,
    reviewer: 3,
  }
  normalized.skills = [...spec.skills].sort(
    (a, b) => (agentOrder[a.target_agent] ?? 99) - (agentOrder[b.target_agent] ?? 99),
  )

  // 3. rules 按 trigger_type 排序
  const triggerOrder: Record<string, number> = {
    on_task_done: 0,
    on_test_fail: 1,
    before_deploy: 2,
  }
  normalized.rules = [...spec.rules].sort(
    (a, b) => (triggerOrder[a.trigger_type] ?? 99) - (triggerOrder[b.trigger_type] ?? 99),
  )

  return normalized
}
