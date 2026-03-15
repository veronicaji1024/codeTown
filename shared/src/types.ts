// ===== 用户公开信息（用于 WebSocket 消息）=====
export interface UserPublic {
  id: string
  email?: string
  display_name: string
  current_level: number
  town_state: {
    buildings: Array<{ level: number; status: 'locked' | 'unlocked' | 'completed'; project_id: string | null }>
  }
}

// ===== 任务 DAG（基础骨架）=====
export interface Task {
  id: string
  title: string
  dependsOn: string[]
  agentType: AgentType
  status: 'pending' | 'running' | 'done' | 'failed'
  isCheckpoint?: boolean  // 执行时阻塞，等待用户确认
  isRetry?: boolean       // 仅在 context.lastTestFailed 为 true 时实际执行
}

export interface TaskDAG {
  tasks: Task[]
}

// ===== WebSocket 消息类型（PRD S9.9）=====

// 服务端 → 客户端
export type WsServerMessage =
  | { type: 'plan_complete'; dag: TaskDAG }
  | { type: 'task_started'; taskId: string; agentId: string }
  | { type: 'agent_chunk'; agentId: string; content: string }
  | { type: 'mirror_chunk'; agentId: string; content: string; isComplete: boolean }
  | { type: 'task_done'; taskId: string; teachingMomentId?: string }
  | { type: 'test_result'; passed: boolean; taskId: string }
  | { type: 'checkpoint'; taskId: string; preview: string }
  | { type: 'build_complete'; outputHtml: string; shareSlug: string; updatedUser?: UserPublic }
  | { type: 'build_error'; message: string; recoverable: boolean }

// 客户端 → 服务端
export type WsClientMessage =
  | { type: 'start_build'; projectSpec: ProjectSpec; apiKey: string }
  | { type: 'checkpoint_response'; taskId: string; action: 'approve' | 'modify'; note?: string }
  | { type: 'stop_build' }

// ===== 项目规格（设计桌输出）=====
export interface ProjectSpec {
  level: 1 | 2 | 3 | 4
  brief: {
    text: string
    project_type: 'website' | 'tool' | 'game' | 'app'
  }
  style: {
    visual_preset: string | null
    visual_description: string
    personality: string
  }
  requirements: Requirement[]
  team: TeamConfig
  skills: SpecSkill[]
  rules: SpecRule[]
  flow_control: FlowInstruction[]
  plugs: Plug[]
  library: LibraryItem[]
}

// ===== 需求条目 =====
export interface Requirement {
  id: string
  type: 'feature' | 'constraint' | 'when_then' | 'data'
  text: string
  when?: string
  then?: string
}

// ===== 团队配置 =====
export interface TeamConfig {
  agents: AgentConfig[]
}

export interface AgentConfig {
  type: 'planner' | 'builder' | 'tester' | 'reviewer'
  enabled: boolean
  project_based_prompt: string
}

// ===== 技能包 =====
export interface SpecSkill {
  skill_id: string
  name: string
  target_agent: 'builder' | 'tester' | 'reviewer' | 'all'
  content: string
}

// ===== 规则 =====
export interface SpecRule {
  rule_id: string
  name: string
  trigger_type: 'on_task_done' | 'on_test_fail' | 'before_deploy'
  content: string
}

// ===== 流程控制 =====
export type FlowInstruction = {
  id: string
  instruction_type: 'sequence' | 'parallel' | 'iterate' | 'checkpoint'
  task_refs: string[]
}

// ===== Plug（外部 API 连接）=====
export type Plug =
  | { id: string; plug_type: 'unsplash'; config: { keyword: string } }
  | { id: string; plug_type: 'mapbox'; config: { location: string } }
  | { id: string; plug_type: 'magic'; config: { description: string; magic_type?: MagicCategory } }

// ===== 图书馆条目 =====
export interface LibraryItem {
  ref_id: string
  source_type: 'file' | 'paste'
  original_name: string
  extracted_text: string
  token_count: number
}

// ===== Agent 类型 =====
export type AgentType =
  | 'planner'
  | 'builder_structure'
  | 'builder_style'
  | 'builder_logic'
  | 'builder_skill'
  | 'tester'
  | 'reviewer'

// ===== 魔法连接分类 =====
export type MagicCategory = 'weather' | 'translate' | 'news' | 'unsupported'
