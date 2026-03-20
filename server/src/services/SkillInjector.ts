import type { AgentType, ProjectSpec } from '@codetown/shared'
import { describeVisualPreset } from '../utils/stylePresets'
import { buildLibraryContext } from '../utils/libraryContext'

// 按关卡等级返回可用 agentType 列表
function getAvailableAgentTypes(level: number): string {
  const types = ['builder_structure', 'builder_style', 'builder_logic']
  if (level >= 2) types.push('tester')
  if (level >= 3) types.push('reviewer', 'builder_skill')
  return types.join(', ')
}

// Agent 基础身份描述（不使用昵称）
const AGENT_ROLES: Record<string, string> = {
  planner: `你是"计划者"，一位专业的项目规划师。
你的职责是将用户的项目需求拆解为可执行的任务列表（TaskDAG）。
每个任务必须包含 id、title、dependsOn（依赖的任务 id 数组）、agentType。
你必须以纯 JSON 格式输出 TaskDAG，不要包含任何其他文字。
JSON 格式：{ "tasks": [ { "id": "t1", "title": "...", "dependsOn": [], "agentType": "builder_structure" }, ... ] }
可用的 agentType: __AVAILABLE_AGENT_TYPES__。
合理安排依赖关系：结构先于样式和逻辑，测试依赖所有构建任务，审核在最后。`,

  builder_structure: `你是"建造者（结构）"，一位专业的前端开发者。
你的职责是根据需求搭建 HTML 页面的整体结构。
输出完整的、可直接在浏览器运行的 HTML 文件，包含所有结构标签。
不要输出代码块标记，直接输出 HTML 代码。`,

  builder_style: `你是"建造者（样式）"，一位专业的前端样式工程师。
你的职责是在已有 HTML 结构基础上编写 CSS 样式。
你会收到之前建造者输出的 HTML，在其基础上添加 <style> 标签和完整样式。
输出完整的 HTML 文件（包含结构 + 样式）。`,

  builder_logic: `你是"建造者（逻辑）"，一位专业的前端交互工程师。
你的职责是在已有 HTML+CSS 基础上编写 JavaScript 交互逻辑。
你会收到之前建造者输出的 HTML，在其基础上添加 <script> 标签和完整逻辑。
输出完整的 HTML 文件（包含结构 + 样式 + 逻辑）。`,

  builder_skill: `你是"建造者（技能）"，一位专业的前端功能工程师。
你的职责是根据技能包描述，为页面添加特定功能模块。
输出完整的 HTML 文件。`,

  tester: `你是"测试者"，一位专业的测试工程师。
你的职责是审查建造者输出的 HTML 代码，检查：
1. 结构完整性（必要标签是否齐全）
2. 样式正确性（是否符合视觉描述）
3. 逻辑正确性（交互是否按需求工作）
4. 是否有明显的 bug 或缺失功能
输出 JSON 格式的测试报告：{ "passed": true/false, "issues": ["问题描述..."] }`,

  reviewer: `你是"审核者"，一位专业的代码审查员。
你的职责是对完成的代码进行最终审查，提出改进建议。
审查维度：代码质量、可读性、性能、安全性。
输出 JSON 格式的审查报告：{ "approved": true/false, "suggestions": ["建议..."] }`,
}

/**
 * 按严格 7 层顺序组装 Agent 的 System Prompt
 *
 * [1] role — Agent 身份
 * [2] project_based_prompt — 用户填写的 Agent 个性化 prompt（L3+）
 * [3] rules_always — 始终激活的规则（L2+）
 * [4] skills — 按 target_agent 匹配的技能（L3+）
 * [5] library — 参考文档（L4，≤3000 字符）
 * [6] flow_control_constraints — 流程控制指令（L3+）
 * [7] task — 当前任务描述
 */
export function buildSystemPrompt(
  agentType: AgentType,
  spec: ProjectSpec,
  taskDescription: string,
): string {
  const sections: string[] = []

  // [1] role
  const baseRole = agentType.startsWith('builder_') ? agentType : agentType
  let rolePrompt = AGENT_ROLES[baseRole]
  if (rolePrompt) {
    // Planner: 动态注入当前关卡可用的 agentType
    if (agentType === 'planner') {
      rolePrompt = rolePrompt.replace('__AVAILABLE_AGENT_TYPES__', getAvailableAgentTypes(spec.level))
    }
    sections.push(rolePrompt)
  }

  // 视觉描述（所有 builder 类型都需要）
  if (agentType.startsWith('builder_')) {
    const visual = describeVisualPreset(spec.style.visual_preset)
    const styleLine = [
      `视觉风格：${visual}`,
      spec.style.visual_description && `用户补充描述：${spec.style.visual_description}`,
      spec.style.personality && `项目个性：${spec.style.personality}`,
    ].filter(Boolean).join('\n')
    sections.push(styleLine)
  }

  // [2] project_based_prompt（L3+）
  if (spec.level >= 3) {
    const agentBaseType = agentType.startsWith('builder_') ? 'builder' : agentType
    const agentConfig = spec.team.agents.find(a => a.type === agentBaseType)
    if (agentConfig?.project_based_prompt) {
      sections.push(`用户对此 Agent 的特别指示：\n${agentConfig.project_based_prompt}`)
    }
  }

  // [3] rules_always（L2+）
  if (spec.level >= 2 && spec.rules.length > 0) {
    const rulesText = spec.rules
      .map(r => `- [${r.trigger_type}] ${r.name}：${r.content}`)
      .join('\n')
    sections.push(`项目规则：\n${rulesText}`)
  }

  // [4] skills（L3+）
  if (spec.level >= 3 && spec.skills.length > 0) {
    const agentBaseType = agentType.startsWith('builder_') ? 'builder' : agentType
    const matched = spec.skills.filter(
      s => s.target_agent === 'all' || s.target_agent === agentBaseType,
    )
    if (matched.length > 0) {
      const skillsText = matched.map(s => `### ${s.name}\n${s.content}`).join('\n\n')
      sections.push(`技能包：\n${skillsText}`)
    }
  }

  // [5] library（L4）
  if (spec.level >= 4 && spec.library.length > 0) {
    const libCtx = buildLibraryContext(spec.library)
    if (libCtx) sections.push(libCtx)
  }

  // [6] flow_control_constraints（L3+）
  if (spec.level >= 3 && spec.flow_control.length > 0) {
    const fcText = spec.flow_control
      .map(fc => `- ${fc.instruction_type}: 任务 [${fc.task_refs.join(', ')}]`)
      .join('\n')
    sections.push(`流程控制约束：\n${fcText}`)
  }

  // [7] task
  sections.push(`当前任务：\n${taskDescription}`)

  // 项目基本信息（始终包含）
  const briefSection = `项目简介：${spec.brief.text}\n项目类型：${spec.brief.project_type}\n关卡等级：L${spec.level}`
  sections.unshift(briefSection)

  return sections.join('\n\n---\n\n')
}
