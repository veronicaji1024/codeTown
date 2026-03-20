import crypto from 'node:crypto'
import type { ProjectSpec, TaskDAG, Task, WsServerMessage } from '@codetown/shared'
import { supabase } from '../lib/supabase'
import { normalizeSpec } from './MetaPlanner'
import { buildSystemPrompt } from './SkillInjector'
import { runAgent } from './AgentRunner'
import { MirrorService } from './MirrorService'
import { nanoid } from '../utils/nanoid'

// 并发构建限制：同一用户不能同时运行 2 个构建
const activeBuilds = new Map<string, boolean>()

export interface OrchestratorCallbacks {
  send: (msg: WsServerMessage) => void
  waitForCheckpoint: (taskId: string) => Promise<{ action: 'approve' | 'modify'; note?: string }>
  isStopped: () => boolean
}

/**
 * Orchestrator — 构建管线调度器
 * 协调 计划者→建造者→测试者→审核者 的完整执行流程
 */
export async function orchestrate(
  userId: string,
  spec: ProjectSpec,
  apiKey: string,
  callbacks: OrchestratorCallbacks,
): Promise<void> {
  // 并发检查
  if (activeBuilds.has(userId)) {
    callbacks.send({ type: 'build_error', message: '已有一个构建正在进行中', recoverable: false })
    return
  }
  activeBuilds.set(userId, true)

  const mirror = new MirrorService()

  try {
    const normalized = normalizeSpec(spec)

    // ========== 阶段 1: 规划 ==========
    const plannerAgentId = `planner-${nanoid(8)}`
    mirror.startBubble(plannerAgentId, 'planner')

    const plannerPrompt = buildSystemPrompt('planner', normalized, '请根据项目需求生成任务执行计划（TaskDAG）。')

    const plannerOutput = await runAgent({
      systemPrompt: plannerPrompt,
      userMessage: `项目名称：${normalized.brief.text}\n项目类型：${normalized.brief.project_type}\n需求列表：\n${normalized.requirements.map(r => `- ${r.text}`).join('\n')}`,
      apiKey,
      onChunk: (chunk) => {
        callbacks.send({ type: 'agent_chunk', agentId: plannerAgentId, content: chunk })
      },
      onMirrorChunk: (chunk, isComplete) => {
        if (isComplete) {
          mirror.completeBubble(plannerAgentId)
        } else {
          mirror.appendChunk(plannerAgentId, chunk)
        }
        callbacks.send({ type: 'mirror_chunk', agentId: plannerAgentId, content: chunk, isComplete })
      },
    })

    if (callbacks.isStopped()) return

    // 解析 TaskDAG
    const dag = parseDag(plannerOutput)
    callbacks.send({ type: 'plan_complete', dag })

    // ========== 阶段 2: 按 DAG 执行任务 ==========
    const taskOutputs = new Map<string, string>()
    let latestHtml = ''

    // 拓扑排序执行
    const completed = new Set<string>()
    const tasks = dag.tasks.map(t => ({ ...t }))

    while (completed.size < tasks.length) {
      if (callbacks.isStopped()) return

      // 找到所有依赖已完成的待执行任务
      const ready = tasks.filter(
        t => !completed.has(t.id) && t.dependsOn.every(dep => completed.has(dep)),
      )

      if (ready.length === 0) {
        callbacks.send({ type: 'build_error', message: 'DAG 存在循环依赖或无法继续执行', recoverable: false })
        return
      }

      // 按顺序执行（并行任务未来可扩展为 Promise.all）
      for (const task of ready) {
        if (callbacks.isStopped()) return

        const agentId = `${task.agentType}-${nanoid(8)}`
        mirror.startBubble(agentId, task.agentType)
        callbacks.send({ type: 'task_started', taskId: task.id, agentId })

        // 组装 user message：包含之前的 HTML 输出
        let userMsg = `任务：${task.title}`
        if (latestHtml && task.agentType.startsWith('builder_')) {
          userMsg += `\n\n以下是当前已有的 HTML 代码，请在此基础上继续：\n${latestHtml}`
        }
        if (latestHtml && (task.agentType === 'tester' || task.agentType === 'reviewer')) {
          userMsg += `\n\n以下是需要审查/测试的完整 HTML 代码：\n${latestHtml}`
        }

        const output = await runAgent({
          systemPrompt: buildSystemPrompt(task.agentType, normalized, task.title),
          userMessage: userMsg,
          apiKey,
          onChunk: (chunk) => {
            callbacks.send({ type: 'agent_chunk', agentId, content: chunk })
          },
          onMirrorChunk: (chunk, isComplete) => {
            if (isComplete) {
              mirror.completeBubble(agentId)
            } else {
              mirror.appendChunk(agentId, chunk)
            }
            callbacks.send({ type: 'mirror_chunk', agentId, content: chunk, isComplete })
          },
        })

        taskOutputs.set(task.id, output)

        // builder 类型：更新 latestHtml
        if (task.agentType.startsWith('builder_')) {
          latestHtml = output
        }

        // tester：解析测试结果
        if (task.agentType === 'tester') {
          const passed = parseTestResult(output)
          callbacks.send({ type: 'test_result', passed, taskId: task.id })
        }

        // checkpoint：等待用户确认
        if (task.isCheckpoint) {
          callbacks.send({ type: 'checkpoint', taskId: task.id, preview: latestHtml })
          const response = await callbacks.waitForCheckpoint(task.id)
          if (response.action === 'modify' && response.note) {
            // 用户要求修改 — 简化处理：将 note 作为额外指令追加后重跑此任务
            // 完整实现留给 Phase 13
          }
        }

        callbacks.send({ type: 'task_done', taskId: task.id })
        completed.add(task.id)
      }
    }

    // ========== 阶段 3: 完成 ==========
    const outputHtml = injectCsp(latestHtml)
    const shareSlug = await generateShareSlug()

    // 写入数据库
    await supabase.from('projects').insert({
      id: nanoid(12),
      user_id: userId,
      level: normalized.level,
      spec: normalized,
      output_html: outputHtml,
      share_slug: shareSlug,
      status: 'completed',
    })

    callbacks.send({
      type: 'build_complete',
      outputHtml,
      shareSlug,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Orchestrator] Build error:', message, err)
    callbacks.send({ type: 'build_error', message, recoverable: false })
  } finally {
    activeBuilds.delete(userId)
    mirror.clear()
  }
}

// ===== 内部工具函数 =====

function parseDag(raw: string): TaskDAG {
  // 尝试从输出中提取 JSON（可能包含 markdown 代码块）
  let jsonStr = raw.trim()
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim()
  }

  const parsed = JSON.parse(jsonStr)
  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error('Invalid TaskDAG: missing tasks array')
  }

  // 补全默认字段
  const tasks: Task[] = parsed.tasks.map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    dependsOn: (t.dependsOn as string[]) || [],
    agentType: t.agentType as Task['agentType'],
    status: 'pending' as const,
    isCheckpoint: !!t.isCheckpoint,
    isRetry: !!t.isRetry,
  }))

  return { tasks }
}

function parseTestResult(output: string): boolean {
  try {
    const jsonStr = output.trim()
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    const parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : jsonStr)
    return !!parsed.passed
  } catch {
    return false
  }
}

function injectCsp(html: string): string {
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; font-src * data:; style-src 'self' 'unsafe-inline' *; connect-src 'none';">`

  // 插入到 <head> 之后
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n  ${cspMeta}`)
  }
  // 没有 head 标签则插入到开头
  return `${cspMeta}\n${html}`
}

async function generateShareSlug(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = crypto.randomBytes(4).toString('hex')
    const { data } = await supabase
      .from('projects')
      .select('id')
      .eq('share_slug', slug)
      .maybeSingle()

    if (!data) return slug
  }
  // 3 次碰撞后用更长的 slug
  return crypto.randomBytes(6).toString('hex')
}
