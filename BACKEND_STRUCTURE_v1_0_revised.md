# CodeTown — Backend Structure v1.0

> **本文件是后端实现的唯一真相来源。** AI 构建后端时必须严格遵循此文档，不得自行补充假设。所有表结构、API 合约、认证逻辑、存储规则均已在此精确定义。
>
> **对应 PRD：** v6.5 | **对应 TECH_STACK：** v1.0 | **日期：** 2026-03-13

---

## 目录

1. [数据库 Schema（完整 SQL）](#1-数据库-schema完整-sql)
2. [JSONB 字段结构定义](#2-jsonb-字段结构定义)
3. [认证逻辑](#3-认证逻辑)
4. [API 端点合约](#4-api-端点合约)
5. [WebSocket 消息协议](#5-websocket-消息协议)
6. [存储规则（Supabase Storage）](#6-存储规则supabase-storage)
7. [服务层职责划分](#7-服务层职责划分)
8. [边缘情况与不变量](#8-边缘情况与不变量)
9. [环境变量清单](#9-环境变量清单)

---

## 1. 数据库 Schema（完整 SQL）

### 前置说明

- PostgreSQL 版本：15.x（Supabase 托管）
- 所有 UUID 用 `gen_random_uuid()`（PostgreSQL 内置，无需扩展）
- 所有时间戳用 `TIMESTAMPTZ`（带时区），统一存储 UTC
- 后端用 `SUPABASE_SERVICE_ROLE_KEY` 初始化，绕过 RLS，RLS 策略仅为安全兜底
- 前端**不直连** Supabase，所有数据操作经 Express 后端

---

### 1.1 `users` 表

```sql
CREATE TABLE users (
  -- 主键（Supabase Auth 的 auth.users.id 同步至此）
  id            UUID        PRIMARY KEY,  -- 不使用 gen_random_uuid()，值来自 Supabase Auth

  -- 登录凭据（email 和 phone 二选一必填，至少一个非空）
  email         TEXT        UNIQUE,       -- 邮箱，可为 NULL（手机号用户）
  phone         TEXT        UNIQUE,       -- 手机号，E.164 格式，如 +8613800138000，可为 NULL（邮箱用户）

  -- 个人信息
  display_name  TEXT        NOT NULL DEFAULT '小匠',  -- 玩家昵称，默认"小匠"
  avatar_url    TEXT,                     -- 预留，v6.4 不使用

  -- 游戏进度
  current_level INT         NOT NULL DEFAULT 1
                            CHECK (current_level BETWEEN 1 AND 4),
  town_state    JSONB       NOT NULL DEFAULT '{"buildings":[{"level":1,"status":"unlocked","project_id":null},{"level":2,"status":"locked","project_id":null},{"level":3,"status":"locked","project_id":null},{"level":4,"status":"locked","project_id":null}]}',

  -- BYOK 安全
  api_key_hash  TEXT,                     -- Claude API Key 的 SHA-256 哈希（hex），原文永不存储
                                          -- 格式：64位小写十六进制字符串
                                          -- 无 UNIQUE 约束：多用户理论上可用同一 Key

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束：email 和 phone 至少有一个非空
  CONSTRAINT users_email_or_phone_required CHECK (
    email IS NOT NULL OR phone IS NOT NULL
  )
);

-- 索引
CREATE INDEX idx_users_email   ON users (email)   WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone   ON users (phone)   WHERE phone IS NOT NULL;

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS（后端用 service_role_key 绕过，此策略仅为安全兜底）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self_only ON users
  USING (id = auth.uid());
```

**`town_state` 初始值说明：** L1 默认 `"unlocked"`（可进入），L2-L4 默认 `"locked"`。完整结构见 §2.1。

---

### 1.2 `projects` 表

```sql
CREATE TABLE projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 关卡与基础信息
  level         INT         NOT NULL CHECK (level BETWEEN 1 AND 4),
  name          TEXT        NOT NULL,    -- 项目名称，从 spec_json.brief 提取（截取前 20 字符）

  -- 项目规格（设计桌输出，序列化为 JSON）
  spec_json     JSONB       NOT NULL,    -- 完整结构见 §2.2

  -- 构建产物
  output_html   TEXT,                   -- AI 生成的最终 HTML（≤200KB）；null 表示未完成
  task_dag      JSONB,                  -- Planner 生成的任务图，结构见 §2.3
  build_log     JSONB       NOT NULL DEFAULT '[]',  -- 构建日志数组，结构见 §2.4
  token_usage   JSONB       NOT NULL DEFAULT '{"totalInputTokens":0,"totalOutputTokens":0,"estimatedCostRMB":0,"perAgent":{}}',
                                        -- 完整结构见 §2.5

  -- 状态
  status        TEXT        NOT NULL DEFAULT 'building'
                            CHECK (status IN ('building', 'completed', 'failed')),
                            -- 'building'  : start_build 收到后立即创建，状态为 building
                            -- 'completed' : build_complete 时更新
                            -- 'failed'    : 用户主动停止或不可恢复错误时更新

  -- 分享
  share_slug    TEXT        UNIQUE,     -- 8位 nanoid（仅 build_complete 后设置）
                                        -- 访问路径：codetown.app/p/{slug}

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ           -- build_complete 时设置
);

-- 索引
CREATE INDEX idx_projects_user_id   ON projects (user_id);
CREATE INDEX idx_projects_user_level ON projects (user_id, level);
CREATE INDEX idx_projects_share_slug ON projects (share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX idx_projects_status    ON projects (status);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_owner_only ON projects
  USING (user_id = auth.uid());
-- share_slug 访问：后端用 service_role_key 查询，前端无需直连
```

---

### 1.3 `drafts` 表

```sql
-- 设计桌草稿持久化。每个用户每个关卡最多一条草稿（UNIQUE 约束）。
-- 构建开始后草稿保留（供中断恢复）。
-- 构建成功完成后，草稿被删除（因为用户"重新建造"应从空白开始，见 PRD §7.4）。

CREATE TABLE drafts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level         INT         NOT NULL CHECK (level BETWEEN 1 AND 4),
  spec_json     JSONB       NOT NULL,   -- 完整结构见 §2.2（允许部分填写，非必填字段可缺省）
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 每用户每关卡唯一
  UNIQUE (user_id, level)
);

-- 索引
CREATE INDEX idx_drafts_user_id ON drafts (user_id);

-- 自动更新 updated_at
CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY drafts_owner_only ON drafts
  USING (user_id = auth.uid());
```

---

### 1.4 `skills` 表

```sql
-- 用户保存的技能包（L3 解锁）。
-- is_builtin = TRUE 的记录由系统在数据库初始化时 seed，user_id 为 NULL。
-- 用户自定义的记录 user_id = 该用户 id。

CREATE TABLE skills (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES users(id) ON DELETE CASCADE,
                            -- NULL 表示内置模板（系统级）
  name          TEXT        NOT NULL,   -- 技能名称，如"响应式布局"
  target_agent  TEXT        NOT NULL
                            CHECK (target_agent IN ('builder', 'tester', 'reviewer', 'all')),
  content       TEXT        NOT NULL,   -- 注入 Agent system prompt 的内容文本
  is_builtin    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 约束：内置技能 user_id 必须为 NULL；用户技能 user_id 必须非 NULL
ALTER TABLE skills ADD CONSTRAINT skills_user_id_builtin_check CHECK (
  (is_builtin = TRUE AND user_id IS NULL) OR
  (is_builtin = FALSE AND user_id IS NOT NULL)
);

-- 索引
CREATE INDEX idx_skills_user_id   ON skills (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_skills_is_builtin ON skills (is_builtin);

-- RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY skills_builtin_or_owner ON skills
  USING (is_builtin = TRUE OR user_id = auth.uid());
```

**内置技能 Seed 数据（5 条）：**

```sql
INSERT INTO skills (user_id, name, target_agent, content, is_builtin) VALUES
(NULL, '响应式布局',   'builder',  '确保所有内容在 320px–1440px 屏幕宽度下均正常显示。使用相对单位（%、rem、vh），不使用固定像素宽度布局。', TRUE),
(NULL, '暗黑模式',    'builder',  '为页面提供暗黑模式支持，使用 CSS 变量定义颜色，通过 prefers-color-scheme 媒体查询自动切换。', TRUE),
(NULL, '无障碍设计',  'builder',  '所有图片添加有意义的 alt 文本，按钮和链接添加 aria-label，确保键盘可导航，颜色对比度不低于 4.5:1。', TRUE),
(NULL, '代码注释',    'builder',  '为每个 HTML 区块、重要 CSS 类和 JavaScript 函数添加简洁的中文注释，帮助读者理解代码意图。', TRUE),
(NULL, '代码整洁',    'reviewer', '检查代码是否有多余空行、重复 CSS、未使用的变量，确保缩进一致（2空格），移除所有 console.log。', TRUE);
```

---

### 1.5 `rules` 表

```sql
-- 用户保存的规则系统（L3 解锁）。
-- is_builtin = TRUE 的记录由系统 seed，user_id 为 NULL。

CREATE TABLE rules (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES users(id) ON DELETE CASCADE,
                            -- NULL 表示内置模板（系统级）
  name          TEXT        NOT NULL,   -- 规则名称，如"测试失败自动重试"
  trigger_type  TEXT        NOT NULL
                            CHECK (trigger_type IN ('on_task_done', 'on_test_fail', 'before_deploy')),
                            -- on_task_done  : 每个子任务完成时触发
                            -- on_test_fail  : Tester 验证失败时触发
                            -- before_deploy : 存储 output_html 前触发
  content       TEXT        NOT NULL,   -- 注入对应阶段 Agent prompt 的内容文本
  is_builtin    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 约束：内置规则 user_id 必须为 NULL；用户规则 user_id 必须非 NULL
ALTER TABLE rules ADD CONSTRAINT rules_user_id_builtin_check CHECK (
  (is_builtin = TRUE AND user_id IS NULL) OR
  (is_builtin = FALSE AND user_id IS NOT NULL)
);

-- 索引
CREATE INDEX idx_rules_user_id    ON rules (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_rules_is_builtin ON rules (is_builtin);

-- RLS
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rules_builtin_or_owner ON rules
  USING (is_builtin = TRUE OR user_id = auth.uid());
```

**内置规则 Seed 数据（3 条）：**

```sql
INSERT INTO rules (user_id, name, trigger_type, content, is_builtin) VALUES
(NULL, '测试失败自动重试', 'on_test_fail',  '如果测试失败，重新分析失败原因并修复代码，最多重试 3 次。每次重试时在代码中添加注释说明修复了什么。', TRUE),
(NULL, '任务完成后代码审查', 'on_task_done', '每个任务完成后，快速检查代码是否符合需求清单中的对应条目，确保没有硬编码的示例文本。', TRUE),
(NULL, '部署前安全检查', 'before_deploy', '部署前检查：不得包含 eval()、document.write()、innerHTML 直接拼接用户输入，不得有 alert() 弹窗。', TRUE);
```

---

### 1.6 `library_refs` 表

```sql
-- 图书馆上传的文件或粘贴的文本（L4 解锁）。
-- 文件型：上传后提取文本，物理文件存 Supabase Storage。
-- 粘贴型：直接存 extracted_text，storage_path 为 NULL。
-- project_id 初始为 NULL（上传时项目尚未创建）；build_complete 后更新为对应 project_id。
-- 关联：通过 user_id + level 定位所属关卡的设计桌。

CREATE TABLE library_refs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id      UUID        REFERENCES projects(id) ON DELETE SET NULL,
                              -- 构建成功前为 NULL，build_complete 后由后端更新
  level           INT         NOT NULL CHECK (level = 4),  -- 图书馆仅 L4 解锁，固定为 4

  -- 文件元信息
  source_type     TEXT        NOT NULL CHECK (source_type IN ('file', 'paste')),
  original_name   TEXT        NOT NULL,   -- 原始文件名或粘贴内容的前 20 字符作为标题
  storage_path    TEXT,                   -- Supabase Storage 路径（paste 类型为 NULL）
                                          -- 格式：library-uploads/{user_id}/{level}/{uuid}_{original_name}

  -- 提取内容
  extracted_text  TEXT,                   -- 提取出的纯文本；文件提取失败时为 NULL
  char_count      INT,                    -- extracted_text 字符数
  token_count     INT,                    -- 估算的 token 数（按 1 token ≈ 1.5 中文字符估算）

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_library_refs_user_level  ON library_refs (user_id, level);
CREATE INDEX idx_library_refs_project_id  ON library_refs (project_id) WHERE project_id IS NOT NULL;

-- RLS
ALTER TABLE library_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_refs_owner_only ON library_refs
  USING (user_id = auth.uid());
```

---

### 1.7 完整 Schema 执行顺序

在 Supabase SQL Editor 中按以下顺序执行：

```
1. create_function_update_updated_at  （trigger function）
2. CREATE TABLE users
3. CREATE TABLE projects
4. CREATE TABLE drafts
5. CREATE TABLE skills
6. CREATE TABLE rules
7. CREATE TABLE library_refs
8. 所有 CREATE INDEX
9. 所有 ALTER TABLE ... ENABLE ROW LEVEL SECURITY
10. 所有 CREATE POLICY
11. INSERT INTO skills ...（seed builtin skills）
12. INSERT INTO rules  ...（seed builtin rules）
```

---

## 2. JSONB 字段结构定义

### 2.1 `users.town_state`

```typescript
interface TownState {
  buildings: BuildingState[];
}

interface BuildingState {
  level: 1 | 2 | 3 | 4;
  status: 'locked' | 'unlocked' | 'completed';
  // 'locked'    : 前置关卡未完成，不可进入
  // 'unlocked'  : 可进入（首次为 L1，每完成一关下一关解锁）
  // 'completed' : 已完成构建，建筑显示彩色
  project_id: string | null;  // 已完成关卡对应的 projects.id，其余为 null
}
```

**初始值（完整 JSON）：**

```json
{
  "buildings": [
    { "level": 1, "status": "unlocked",   "project_id": null },
    { "level": 2, "status": "locked",     "project_id": null },
    { "level": 3, "status": "locked",     "project_id": null },
    { "level": 4, "status": "locked",     "project_id": null }
  ]
}
```

**状态转换规则：**
- 完成 L1 → L1.status='completed', L1.project_id=uuid, L2.status='unlocked'
- 完成 L2 → L2.status='completed', L2.project_id=uuid, L3.status='unlocked'
- 依此类推

---

### 2.2 `projects.spec_json` 与 `drafts.spec_json`

```typescript
interface ProjectSpec {
  level: 1 | 2 | 3 | 4;

  // 委托单（Commission）— L1-L4 必填
  brief: {
    text: string;                   // 自由文本，如"面包店新品展示页"
    project_type: 'website' | 'tool' | 'game' | 'app';
  };

  // 装修方案（Style）— L1-L4 必填
  style: {
    visual_preset: string | null;   // 预设风格 ID，如 'warm_sketch'；自定义时为 null
    visual_description: string;     // 视觉描述，预设时自动填入，自定义时用户填写
    personality: string;            // 性格描述，影响 AI 语气，如"活泼可爱"
  };

  // 需求清单（Requirements）— L1-L4 必填，至少 1 条
  requirements: Requirement[];

  // 工匠团队（Craftsmen）— L1 固定，L2+ 可配置
  team: TeamConfig;

  // 技能包（Skills）— L3+ 可选
  skills: SpecSkill[];

  // 规则系统（Rules）— L3+ 可选
  rules: SpecRule[];

  // 流程控制（Flow Control）— L3+ 可选
  flow_control: FlowInstruction[];

  // Plug — L3+ 可选
  plugs: Plug[];

  // 图书馆（Library）— L4+ 可选
  library: LibraryItem[];
}

// --- 嵌套类型 ---

interface Requirement {
  id: string;                       // 客户端生成的临时 ID（如 'req_1'）
  type: 'feature' | 'constraint' | 'when_then' | 'data';
  // 'feature'    : L1+ 功能需求
  // 'constraint' : L2+ 约束
  // 'when_then'  : L2+ 条件需求
  // 'data'       : L4+ 数据需求
  text: string;                     // 需求内容，如"展示 3 款新品"
  // when_then 类型时：
  when?: string;                    // 触发条件，如"用户点击按钮"
  then?: string;                    // 预期结果，如"展示弹窗"
}

interface TeamConfig {
  agents: AgentConfig[];
}

interface AgentConfig {
  type: 'planner' | 'builder' | 'tester' | 'reviewer';
  enabled: boolean;
  project_based_prompt: string;     // 用户填写的项目级 prompt，空字符串表示未填写
  // L1：planner + builder 固定 enabled=true，不可修改
  // L2：planner + builder + tester 默认，可调整
  // L3-L4：全部 4 个角色可用
}

interface SpecSkill {
  skill_id: string;                 // 引用 skills.id（内置或用户自定义）
  name: string;                     // 技能名称（冗余存储，避免关联查询）
  target_agent: 'builder' | 'tester' | 'reviewer' | 'all';
  content: string;                  // 技能内容（冗余存储快照，防止 skills 表被修改影响历史）
}

interface SpecRule {
  rule_id: string;                  // 引用 rules.id
  name: string;                     // 规则名称（冗余存储）
  trigger_type: 'on_task_done' | 'on_test_fail' | 'before_deploy';
  content: string;                  // 规则内容（冗余存储快照）
}

interface FlowInstruction {
  id: string;                       // 客户端生成 ID（如 'flow_1'）
  instruction_type: 'sequence' | 'parallel' | 'iterate' | 'checkpoint';
  // 'sequence'   : 先/后（First → Then）
  // 'parallel'   : 同时进行
  // 'iterate'    : 持续改进（max 3 次）
  // 'checkpoint' : 让我看看（人工审批）
  task_refs: string[];              // 引用需求清单中的 requirement.id
}

interface Plug {
  id: string;                       // 客户端生成 ID
  plug_type: 'unsplash' | 'mapbox' | 'magic';
  config: {
    // unsplash: { keyword: string }
    // mapbox:   { location: string }
    // magic:    { description: string, magic_type?: 'weather' | 'translate' | 'news' | 'unsupported' }
    [key: string]: string | undefined;
  };
}

interface LibraryItem {
  ref_id: string;                   // 引用 library_refs.id
  source_type: 'file' | 'paste';
  original_name: string;            // 显示用
  extracted_text: string;           // 提取的纯文本（冗余存储快照）
  token_count: number;
}
```

**草稿（drafts）的 spec_json 与项目（projects）的 spec_json 结构相同，** 区别在于草稿允许字段缺省（未填写的可选组件为空数组/默认值），而 projects.spec_json 是构建开始时的最终快照。

---

### 2.3 `projects.task_dag`

```typescript
interface TaskDAG {
  tasks: Task[];
  edges: Edge[];          // 任务依赖关系（有向边）
}

interface Task {
  id: string;             // 如 'task_1', 'task_2'
  description: string;   // 任务描述，如"搭建 HTML 骨架"
  agent_type: 'planner' | 'builder_structure' | 'builder_style'
            | 'builder_logic' | 'builder_skill' | 'tester' | 'reviewer';
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
  max_retries: number;    // 默认 1（除 tester 外），tester 重试受规则控制
  retry_count: number;    // 当前已重试次数
  is_checkpoint: boolean; // 是否为"让我看看"节点
}

interface Edge {
  from: string;           // Task id
  to: string;             // Task id（from 完成后 to 才可执行）
}
```

**L1 Hardcoded DAG（不由 Planner Agent 生成）：**

```json
{
  "tasks": [
    { "id": "task_1", "description": "搭建 HTML 骨架与内容结构", "agent_type": "builder_structure", "status": "pending", "max_retries": 1, "retry_count": 0, "is_checkpoint": false },
    { "id": "task_2", "description": "编写 CSS 样式与视觉设计", "agent_type": "builder_style",     "status": "pending", "max_retries": 1, "retry_count": 0, "is_checkpoint": false },
    { "id": "task_3", "description": "添加交互逻辑（如有需求）",   "agent_type": "builder_logic",     "status": "pending", "max_retries": 1, "retry_count": 0, "is_checkpoint": false }
  ],
  "edges": [
    { "from": "task_1", "to": "task_2" },
    { "from": "task_2", "to": "task_3" }
  ]
}
```

---

### 2.4 `projects.build_log`

```typescript
type BuildLog = BuildLogEntry[];

interface BuildLogEntry {
  task_id: string;
  agent_type: string;
  started_at: string;     // ISO 8601 UTC
  completed_at: string | null;
  status: 'done' | 'failed' | 'skipped';
  retry_count: number;
  teaching_moment: TeachingMoment | null;  // build_complete 时由 LLM 生成
  error_message: string | null;            // 失败时的错误信息
}

interface TeachingMoment {
  id: string;             // 如 'tm_planner_1'，格式：tm_{agent_type}_{序号}
  title: string;          // 3-6 字概念标题
  body: string;           // 2-3 句话正文，≤80 字
}
```

---

### 2.5 `projects.token_usage`

```typescript
interface TokenUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost_rmb: number;   // 人民币成本估算，保留 4 位小数
  per_agent: {
    [agent_type: string]: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}
```

**示例：**

```json
{
  "total_input_tokens": 12450,
  "total_output_tokens": 3820,
  "estimated_cost_rmb": 0.2315,
  "per_agent": {
    "planner":          { "input_tokens": 2100, "output_tokens": 620 },
    "builder_structure":{ "input_tokens": 4200, "output_tokens": 1500 },
    "builder_style":    { "input_tokens": 3800, "output_tokens": 1300 },
    "tester":           { "input_tokens": 1850, "output_tokens": 280  },
    "reviewer":         { "input_tokens": 500,  "output_tokens": 120  }
  }
}
```

**成本估算公式（claude-sonnet-4-6 价格，2026-03 参考値）：**

```typescript
const INPUT_PRICE_PER_1K  = 0.003;  // USD per 1K input tokens
const OUTPUT_PRICE_PER_1K = 0.015;  // USD per 1K output tokens
const USD_TO_RMB          = 7.3;    // 汇率（可配置为环境变量）

const costUSD = (total_input_tokens  / 1000 * INPUT_PRICE_PER_1K) +
                (total_output_tokens / 1000 * OUTPUT_PRICE_PER_1K);
const estimatedCostRmb = parseFloat((costUSD * USD_TO_RMB).toFixed(4));
```

---

## 3. 认证逻辑

### 3.1 认证方案总览

| 维度 | 决策 |
|------|------|
| 认证提供方 | Supabase Auth |
| 登录方式 | 邮箱+密码 / 手机号+密码（两选一）|
| 第三方登录 | ❌ 不支持（PRD §1.6 明确排除）|
| 游客模式 | ❌ 不支持（进入小镇必须登录）|
| 前端直连 Supabase | ❌ 禁止；所有请求经 Express 后端代理 |
| Token 类型 | Supabase JWT（access_token + refresh_token）|
| Token 有效期 | access_token: 3600s（1h）；refresh_token: 30天 |
| 前端 Token 存储 | React state（内存）+ `sessionStorage`（页面刷新恢复）|
| 后端 Token 验证 | `supabase.auth.getUser(bearerToken)` |

### 3.2 Express 认证中间件

**文件位置：** `server/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';  // service_role_key 初始化的客户端

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token', message: '请先登录' });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'invalid_token', message: '登录已失效，请重新登录' });
    return;
  }

  (req as AuthenticatedRequest).userId = data.user.id;
  next();
}
```

**所有需要用户身份的路由必须使用此中间件。** 唯一的例外：
- `GET /health`（无需认证）
- `GET /api/projects/share/:slug`（公开分享页，无需认证）

### 3.3 Supabase 后端客户端初始化

**文件位置：** `server/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// 必须用 SERVICE_ROLE_KEY，绕过 RLS，仅在后端使用
// 绝对不能暴露到前端
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### 3.4 注册流程

```
前端                          Express                       Supabase Auth
  |                              |                                |
  |-- POST /api/auth/register -->|                                |
  |   { email?, phone?,          |                                |
  |     password, display_name } |                                |
  |                              |-- supabase.auth.signUp() ----->|
  |                              |   { email/phone, password }    |
  |                              |<-- { user, session } ----------|
  |                              |                                |
  |                              |-- INSERT INTO users            |
  |                              |   { id=user.id, email, phone,  |
  |                              |     display_name }             |
  |                              |                                |
  |<-- { access_token,           |                                |
  |      refresh_token,          |                                |
  |      user: {...} } ----------|                                |
```

**注意：** Supabase Auth 在 `auth.users` 中创建用户记录。后端**额外**在公开的 `public.users` 表中创建对应记录（存储游戏数据）。两者通过相同的 UUID 关联。

**邮箱/手机号二选一验证：**
- `email` 和 `phone` 不能同时为空
- `email` 格式用正则 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` 校验
- `phone` 必须为 E.164 格式，用正则 `/^\+[1-9]\d{7,14}$/` 校验

### 3.5 登录流程

```
前端                          Express                       Supabase Auth
  |                              |                                |
  |-- POST /api/auth/login ----->|                                |
  |   { identifier,              |                                |
  |     password }               |                                |
  |                              | 判断 identifier 是邮箱还是手机号 |
  |                              |-- supabase.auth.signIn() ----->|
  |                              |   WithPassword({ email/phone, password }) |
  |                              |<-- { user, session } ----------|
  |<-- { access_token,           |                                |
  |      refresh_token,          |                                |
  |      expires_in: 3600,       |                                |
  |      user: { id, email,      |                                |
  |        display_name,         |                                |
  |        current_level,        |                                |
  |        town_state,           |                                |
  |        has_api_key: bool } } |                                |
```

**`identifier` 判断逻辑：**
```typescript
const isPhone = /^\+[1-9]\d{7,14}$/.test(identifier) || /^1[3-9]\d{9}$/.test(identifier);
// 国内手机号（无+86前缀）自动补全为 +86{phone}
const normalizedPhone = isPhone && !identifier.startsWith('+')
  ? `+86${identifier}`
  : identifier;
```

### 3.6 Token 刷新

```
前端                          Express
  |                              |
  |-- POST /api/auth/refresh --->|
  |   { refresh_token }          |
  |                              |-- supabase.auth.refreshSession()
  |<-- { access_token,           |
  |      refresh_token,          |
  |      expires_in } -----------|
```

**前端刷新时机：** access_token 过期前 5 分钟（expires_in - 300）主动刷新。不依赖 401 触发被动刷新。

### 3.7 BYOK（API Key 管理）

**安全原则：**
1. 原始 API Key **永不写入数据库**、**永不写入日志**
2. 仅在构建请求的内存中使用（WS 连接闭包内），连接关闭即销毁
3. 数据库只存 SHA-256 哈希，用于判断"用户是否已配置 Key"

**BYOK 存储流程（`POST /api/auth/byok`）：**

```typescript
import { createHash } from 'node:crypto';

// 接收格式验证（sk- 前缀，Opencode API Key，与 PRD BYOK-2 一致）
const OPENCODE_KEY_REGEX = /^sk-[\w\-]+$/;

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

// 路由处理
async function handleByok(req: AuthenticatedRequest, res: Response) {
  const { api_key } = req.body as { api_key: string };

  // 1. 格式验证
  if (!OPENCODE_KEY_REGEX.test(api_key)) {
    return res.status(400).json({
      error: 'invalid_key_format',
      message: 'API Key 格式不正确，应以 sk- 开头'
    });
  }

  // 2. 计算哈希（原文此刻销毁，只用哈希）
  const keyHash = hashApiKey(api_key);

  // 3. 存哈希到数据库
  await supabase
    .from('users')
    .update({ api_key_hash: keyHash })
    .eq('id', req.userId);

  // 4. 不返回 key，不返回 hash
  return res.json({ success: true, message: 'API Key 已配置' });
}
```

**构建时的 Key 传输：**
- 前端在 WS `start_build` 消息中携带 `apiKey`（原文，存于 sessionStorage）
- 后端在 WS 连接的闭包变量中持有，单次构建全程使用
- 构建完成/失败/WS 断开后，闭包销毁，Key 从内存清除
- Key **不经任何日志输出**（后端日志中的 API Key 字段必须脱敏或省略）

**`has_api_key` 字段：** 登录响应中返回 `has_api_key: boolean`（`api_key_hash IS NOT NULL`），前端用于决定是否显示 BYOK 拦截弹窗。

---

## 4. API 端点合约

### 全局约定

**Base URL（开发）：** `http://localhost:3001`

**通用请求头：**
```
Content-Type: application/json
Authorization: Bearer {access_token}   （除公开端点外必填）
```

**通用错误响应格式：**
```typescript
interface ErrorResponse {
  error: string;    // 机器可读的错误码
  message: string;  // 用户友好的中文错误信息
}
```

**通用成功响应格式：** 各端点自定义，见下文。

**HTTP 状态码约定：**
| 状态码 | 含义 |
|--------|------|
| 200 | 成功（GET、PUT、PATCH） |
| 201 | 创建成功（POST 创建资源） |
| 400 | 请求参数错误 |
| 401 | 未认证（token 无效/缺失） |
| 403 | 无权限（认证成功但无权访问该资源） |
| 404 | 资源不存在 |
| 409 | 冲突（如重复注册） |
| 413 | 请求体过大 |
| 429 | 请求频率过高（API Key 额度耗尽） |
| 500 | 服务器内部错误 |

---

### 4.1 系统端点

#### `GET /health`
- **认证：** 无
- **响应 200：**
  ```json
  { "status": "ok", "timestamp": "2026-03-13T10:00:00.000Z" }
  ```

---

### 4.2 认证端点（`/api/auth`）

#### `POST /api/auth/register`
- **认证：** 无
- **请求体：**
  ```typescript
  {
    email?: string;        // 与 phone 二选一必填
    phone?: string;        // E.164 格式（如 +8613800138000）或国内格式（如 13800138000）
    password: string;      // ≥8 字符
    display_name?: string; // 默认"小匠"
  }
  ```
- **响应 201：**
  ```typescript
  {
    access_token: string;
    refresh_token: string;
    expires_in: number;        // 秒，固定 3600
    user: {
      id: string;
      email: string | null;
      phone: string | null;
      display_name: string;
      current_level: number;   // 1
      town_state: TownState;
      has_api_key: false;
    }
  }
  ```
- **响应 409：** `{ error: 'email_already_exists' }` 或 `{ error: 'phone_already_exists' }`
- **响应 400：** `{ error: 'invalid_email' | 'invalid_phone' | 'password_too_short' | 'missing_identifier' }`

---

#### `POST /api/auth/login`
- **认证：** 无
- **请求体：**
  ```typescript
  {
    identifier: string;  // 邮箱或手机号（后端自动判断）
    password: string;
  }
  ```
- **响应 200：** 与 register 相同结构（`has_api_key` 可能为 `true`）
- **响应 401：** `{ error: 'invalid_credentials', message: '邮箱/手机号或密码错误' }`

---

#### `POST /api/auth/logout`
- **认证：** 必须
- **请求体：** `{ refresh_token: string }`
- **响应 200：** `{ success: true }`

---

#### `GET /api/auth/me`
- **认证：** 必须
- **响应 200：**
  ```typescript
  {
    id: string;
    email: string | null;
    phone: string | null;
    display_name: string;
    current_level: number;
    town_state: TownState;
    has_api_key: boolean;
    created_at: string;
  }
  ```

---

#### `POST /api/auth/refresh`
- **认证：** 无（旧 access_token 可能已过期）
- **请求体：** `{ refresh_token: string }`
- **响应 200：**
  ```typescript
  {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }
  ```
- **响应 401：** `{ error: 'invalid_refresh_token' }`

---

#### `POST /api/auth/byok`
- **认证：** 必须
- **请求体：** `{ api_key: string }`
- **响应 200：** `{ success: true, message: 'API Key 已配置' }`
- **响应 400：** `{ error: 'invalid_key_format', message: 'API Key 格式不正确，应以 sk- 开头' }`
- **注意：** 响应体中永远不返回原始 key 或其哈希

---

### 4.3 草稿端点（`/api/drafts`）

#### `GET /api/drafts/:level`
- **认证：** 必须
- **路径参数：** `level` 为整数 1-4
- **响应 200（有草稿）：**
  ```typescript
  {
    id: string;
    level: number;
    spec_json: ProjectSpec;  // 见 §2.2
    updated_at: string;
  }
  ```
- **响应 404（无草稿）：** `{ error: 'draft_not_found' }`
- **用途：** 用户重新进入设计桌时，前端调用此端点恢复草稿内容

---

#### `PUT /api/drafts/:level`
- **认证：** 必须
- **路径参数：** `level` 为整数 1-4
- **请求体：** `{ spec_json: Partial<ProjectSpec> }`（允许部分字段，表示填写进度）
- **行为：** UPSERT（insert or update on conflict (user_id, level)）
- **响应 200：**
  ```typescript
  {
    id: string;
    updated_at: string;
  }
  ```
- **调用时机：** 前端每次用户修改设计桌卡片后（防抖 1000ms）自动调用

---

### 4.4 项目端点（`/api/projects`）

#### `GET /api/projects`
- **认证：** 必须
- **描述：** 获取当前用户所有已完成（status=completed）的项目
- **响应 200：**
  ```typescript
  {
    projects: Array<{
      id: string;
      level: number;
      name: string;
      share_slug: string;
      token_usage: TokenUsage;
      created_at: string;
      completed_at: string;
    }>
  }
  ```

---

#### `GET /api/projects/share/:slug`
- **认证：** 无（公开端点）
- **路径参数：** `slug`（8位 nanoid）
- **响应 200：**
  ```typescript
  {
    project: {
      name: string;
      level: number;
      output_html: string;   // 直接返回生成的 HTML
      creator_display_name: string;
      completed_at: string;
    }
  }
  ```
- **响应 404：** `{ error: 'project_not_found' }`
- **注意：** 只返回 status=completed 的项目；不返回 spec_json、build_log、token_usage

---

### 4.5 图书馆端点（`/api/library`）

#### `POST /api/library/upload`
- **认证：** 必须
- **Content-Type：** `multipart/form-data`
- **请求体（form-data）：**
  ```
  file: File              // .txt/.md/.doc/.docx，≤500KB
  level: number           // 固定为 4（图书馆仅 L4 解锁）
  ```
- **文件大小限制：** multer `limits.fileSize = 500 * 1024`（500KB）；超出返回 413
- **支持的 MIME 类型：**
  ```
  text/plain
  text/markdown
  application/msword
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
  ```
- **不支持的类型（包括 PDF）返回 400：** `{ error: 'unsupported_file_type' }`
- **处理流程：**
  1. 用 multer 接收文件，存至临时路径
  2. 根据 MIME 类型提取文本（.txt/.md：fs.readFile；.doc/.docx：mammoth）
  3. 提取失败 → 返回 422 `{ error: 'file_parse_error', message: '这个文件打不开，试试粘贴文本？' }`
  4. 上传原始文件到 Supabase Storage（路径：`library-uploads/{userId}/{level}/{uuid}_{originalname}`）
  5. 插入 library_refs 记录（project_id = NULL，source_type = 'file'）
  6. 删除临时文件
- **响应 201：**
  ```typescript
  {
    ref_id: string;
    original_name: string;
    extracted_text: string;
    char_count: number;
    token_count: number;
  }
  ```

---

#### `POST /api/library/paste`
- **认证：** 必须
- **请求体：**
  ```typescript
  {
    level: 4;             // 固定为 4（图书馆仅 L4 解锁）
    title: string;        // 用户给这条资料起的标题（≤20 字符）
    text: string;         // 粘贴的文本内容（≤2000 字符，超出返回 400）
  }
  ```
- **响应 201：**
  ```typescript
  {
    ref_id: string;
    original_name: string;   // 等于 title
    char_count: number;
    token_count: number;
  }
  ```

---

#### `DELETE /api/library/:refId`
- **认证：** 必须
- **路径参数：** `refId`（library_refs.id）
- **权限校验：** 确认 library_refs.user_id = req.userId（否则返回 403）
- **行为：** 删除 library_refs 记录；如果 storage_path 非空，同时删除 Supabase Storage 中的文件
- **响应 200：** `{ success: true }`

---

### 4.6 Plug 代理端点（`/api/plug`）

所有 Plug 端点**仅在后端调用外部 API**，前端无法直接访问外部服务。后端持有所有平台 Key。

#### `POST /api/plug/unsplash`
- **认证：** 必须
- **请求体：** `{ keyword: string }`（关键词，≤100 字符）
- **处理：** 调用 Unsplash API，返回前 5 张图片
- **响应 200：**
  ```typescript
  {
    images: Array<{
      url: string;          // 图片 URL（regular 尺寸）
      alt_description: string;
      photographer: string;
    }>
  }
  ```
- **Unsplash 调用：**
  ```
  GET https://api.unsplash.com/search/photos?query={keyword}&per_page=5
  Authorization: Client-ID {UNSPLASH_ACCESS_KEY}
  ```
- **响应 503（Unsplash 调用失败）：** `{ error: 'external_service_error', message: '外部服务暂时不可用' }`

---

#### `POST /api/plug/mapbox`
- **认证：** 必须
- **请求体：** `{ location: string }`（地点名称，≤100 字符）
- **处理：**
  1. Mapbox Geocoding API 获取经纬度
  2. 拼接静态地图 URL（不发第二次请求）
- **响应 200：**
  ```typescript
  {
    coordinates: { lon: number; lat: number };
    map_url: string;    // 静态地图 URL，直接嵌入 img src
    place_name: string; // Mapbox 返回的标准地名
  }
  ```
- **Mapbox 调用：**
  ```
  GET https://api.mapbox.com/search/geocode/v6/forward
    ?q={location}
    &access_token={MAPBOX_ACCESS_TOKEN}
  ```
- **地名找不到返回 404：** `{ error: 'location_not_found', message: '找不到这个地点' }`

---

#### `POST /api/plug/magic`
- **认证：** 必须
- **请求体：** `{ description: string }`（用户自然语言描述，≤200 字符）
- **处理：** MagicConnector 分类器 → 调用对应白名单 API（见 TECH_STACK §8）
- **响应 200：**
  ```typescript
  {
    category: 'weather' | 'translate' | 'news' | 'unsupported';
    data: unknown;          // 结构因 category 不同而异（见下）
    summary: string;        // Agent 用于重新表述的摘要提示（中文）
  }
  ```
- **category = 'weather' 时 data 结构：**
  ```typescript
  {
    city: string;
    forecasts: Array<{
      date: string; dayweather: string; nightweather: string;
      daytemp: string; nighttemp: string;
    }>
  }
  ```
- **category = 'translate' 时 data 结构：**
  ```typescript
  { src: string; dst: string; }
  ```
- **category = 'news' 时 data 结构：**
  ```typescript
  Array<{ title: string; id: string; }>  // 仅标题，无正文（版权合规）
  ```
- **category = 'unsupported' 时 data：** `null`

---

### 4.7 Meta Planner 端点

#### `POST /api/meta-plan`
- **认证：** 必须
- **请求头（额外）：** `X-API-Key: {claude_api_key}`
- **请求体：**
  ```typescript
  {
    level: 1 | 2 | 3 | 4;
    spec_json: ProjectSpec;   // 当前设计桌内容
  }
  ```
- **处理（L1）：** Hardcoded，直接按委托单→装修方案→需求清单顺序排列，不调用 Claude，不消耗 Token
- **处理（L2-L4）：** 调用 `claude-sonnet-4-6`，整理图纸卡片顺序，返回排列好的 spec_json
- **响应 200：**
  ```typescript
  {
    organized_spec: ProjectSpec;  // 卡片按逻辑顺序排列后的 spec
    token_used: { input: number; output: number; };
  }
  ```
- **响应 401（Key 无效）：** `{ error: 'invalid_api_key', message: '许可证无效，请重新输入' }`
- **响应 429（Key 额度用完）：** `{ error: 'api_quota_exceeded', message: '许可证额度已用完' }`
- **注意：** API Key 只从请求头读取，**不存储**，处理完即销毁

---

## 5. WebSocket 消息协议

### 5.1 连接建立

**WebSocket 端点：** `ws://localhost:3001/ws?token={access_token}`

- 连接时通过 URL query param 传递 JWT access_token
- 后端在 `upgrade` 事件中验证 token：
  ```typescript
  wsServer.on('connection', async (ws, req) => {
    const url = new URL(req.url!, `http://localhost`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'missing_token');
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      ws.close(4001, 'invalid_token');
      return;
    }

    const userId = data.user.id;
    // 建立连接成功，开始处理消息
  });
  ```
- 每个用户同时只允许一个活跃 WebSocket 连接（新连接自动关闭旧连接）

### 5.2 客户端 → 服务端消息（C→S）

```typescript
type WsClientMessage =
  | StartBuildMessage
  | CheckpointResponseMessage
  | StopBuildMessage;

interface StartBuildMessage {
  type: 'start_build';
  api_key: string;      // 用户的 Claude API Key（原文，构建期间内存持有，不记录日志）
  spec_json: ProjectSpec;
  level: 1 | 2 | 3 | 4;
}

interface CheckpointResponseMessage {
  type: 'checkpoint_response';
  task_id: string;      // 对应 TaskDAG 中暂停的 task.id
  action: 'approve' | 'modify';
  note?: string;        // action='modify' 时的修改说明（≤500 字符）
}

interface StopBuildMessage {
  type: 'stop_build';
  // 无额外字段；服务端收到后停止构建，project.status 更新为 'failed'
}
```

### 5.3 服务端 → 客户端消息（S→C）

```typescript
type WsServerMessage =
  | PlanCompleteMessage
  | TaskStartedMessage
  | AgentChunkMessage
  | MirrorChunkMessage
  | TaskDoneMessage
  | TestResultMessage
  | CheckpointMessage
  | BuildCompleteMessage
  | BuildErrorMessage;

interface PlanCompleteMessage {
  type: 'plan_complete';
  dag: TaskDAG;   // Planner Agent 输出的完整任务图（见 §2.3）
}

interface TaskStartedMessage {
  type: 'task_started';
  task_id: string;
  agent_type: string;   // 'builder_structure' | 'builder_style' | ...
}

interface AgentChunkMessage {
  type: 'agent_chunk';
  task_id: string;
  agent_type: string;
  content: string;       // Agent 实际代码/文本输出增量（用于 Token 计数）
}

interface MirrorChunkMessage {
  type: 'mirror_chunk';
  task_id: string;
  agent_type: string;
  content: string;       // LLM chain-of-thought 增量文本（显示在 Mirror 气泡区）
  is_complete: boolean;  // true 表示该 Agent 的思考流结束
}

interface TaskDoneMessage {
  type: 'task_done';
  task_id: string;
  status: 'done' | 'failed';
  teaching_moment: TeachingMoment | null;  // 每个 Agent 完成都生成一个 TM
  retry_count: number;
}

interface TestResultMessage {
  type: 'test_result';
  task_id: string;
  passed: boolean;
  failure_reason?: string;   // passed=false 时说明失败原因（中文，≤100字）
}

interface CheckpointMessage {
  type: 'checkpoint';
  task_id: string;
  preview: string;     // 当前构建产物的简要描述（如"已完成 HTML 骨架和样式"）
}

interface BuildCompleteMessage {
  type: 'build_complete';
  project_id: string;
  output_html: string;     // 完整生成的 HTML（≤200KB）
  share_slug: string;      // 8位 nanoid
  token_usage: TokenUsage;
}

interface BuildErrorMessage {
  type: 'build_error';
  message: string;         // 中文错误描述
  recoverable: boolean;    // false 时前端显示"停止构建"按钮
  error_type: 'invalid_api_key' | 'quota_exceeded' | 'timeout' | 'tester_max_retries' | 'output_too_large' | 'unknown';
}
```

### 5.4 WebSocket 断连重连策略

**前端重连（指数退避）：**
```typescript
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];  // ms，最多 5 次
```

**服务端状态保持：**
- 构建进度存于内存（Orchestrator 实例），**不持久化到数据库**
- 断连后重连：已完成工位状态通过 `task_dag` 字段恢复（前端从 plan_complete 消息重建）
- 5 次重连失败：构建进度丢失，用户需重新开始（符合 PRD §7.5）

---

## 6. 存储规则（Supabase Storage）

### 6.1 Bucket 配置

| Bucket 名 | 类型 | 用途 | 文件大小限制 |
|-----------|------|------|-------------|
| `library-uploads` | Private（非公开） | 图书馆上传的文件 | 500KB |

**创建 Bucket 的 SQL（在 Supabase Dashboard > Storage 执行，或使用 admin API）：**

```sql
-- Supabase Storage bucket 配置通过 Dashboard 或 Admin API 创建
-- 以下为参考配置说明（不是标准 SQL）：
-- bucket_id: 'library-uploads'
-- public: false
-- file_size_limit: 512000  (500KB in bytes)
-- allowed_mime_types: ['text/plain', 'text/markdown', 'application/msword',
--   'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
```

### 6.2 文件路径规范

**格式：** `library-uploads/{userId}/{level}/{uuid}_{originalFilename}`

**示例：**
```
library-uploads/
  550e8400-e29b-41d4-a716-446655440000/
    4/
      8f14e45f-ceea-467a-a866-f6e3e4a8e0b1_参考资料.txt
      3b12f1df-662a-4ce1-b2a0-5a37d7fd5a47_需求文档.md
```

**`uuid` 部分** 用 `crypto.randomUUID()` 生成，确保同名文件不冲突。

### 6.3 后端上传代码（`server/src/services/LibraryExtractor.ts`）

```typescript
async function uploadToStorage(
  userId: string,
  level: number,
  fileBuffer: Buffer,
  originalFilename: string
): Promise<string> {
  const uuid = crypto.randomUUID();
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, '_');
  const storagePath = `${userId}/${level}/${uuid}_${safeName}`;

  const { error } = await supabase.storage
    .from('library-uploads')
    .upload(storagePath, fileBuffer, {
      contentType: getMimeType(originalFilename),
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}
```

### 6.4 文件删除规则

**删除时机：**
1. 用户主动删除图书馆资料（`DELETE /api/library/:refId`）
2. 用户账号注销（v6.4 不实现，预留）
3. 定期清理孤儿文件（library_refs.project_id 仍为 NULL 且 created_at < 7天前的记录）

**孤儿文件清理（可选，后期实现）：** 使用 Supabase 定时任务或外部 cron job。

### 6.5 Storage 访问控制

- Bucket 为 **Private**，前端无法直接访问
- 所有文件访问通过后端 Express API（使用 service_role_key）
- 文件提取文本后，前端只接收文本内容，**不接收文件 URL**
- 前端展示的是 `extracted_text`，不是文件的 presigned URL

---

## 7. 服务层职责划分

**文件：** `server/src/services/`

| 文件 | 职责 | 关键方法 |
|------|------|---------|
| `MetaPlanner.ts` | 整理设计桌卡片顺序 | `organize(spec, apiKey, level)` |
| `Orchestrator.ts` | 管理整个构建流水线 | `startBuild(ws, spec, apiKey, userId)` |
| `AgentRunner.ts` | 执行单个 Agent 调用（流式） | `runAgent(config, ws, taskId)` |
| `MirrorService.ts` | 从 Agent stream 提取 thinking 推送 Mirror | `streamToMirror(stream, ws, taskId)` |
| `PlugProxy.ts` | 代理 Unsplash/Mapbox/Magic 请求 | `unsplash(kw)`, `mapbox(loc)`, `magic(desc)` |
| `MagicConnector.ts` | 白名单分类器 + 外部 API 调用 | `classifyAndCall(description)` |
| `LibraryExtractor.ts` | 文件上传 + 文本提取 + Storage | `extract(file)`, `uploadToStorage(...)` |
| `SkillInjector.ts` | 组装 Agent system prompt | `buildSystemPrompt(agentType, spec)` |

### 7.1 `SkillInjector.ts` Prompt 组装顺序

每个 Agent 的 system prompt 按以下层叠顺序组装（顺序固定，不可调换）：

```
[1] role          → Agent 身份定义（Planner / Builder / Tester / Reviewer）
[2] project_brief → 用户填写的委托单 + 装修方案
[3] pbp           → 用户在该工匠卡片上填写的 project-based prompt（L3+，可为空）
[4] skills        → 匹配该 Agent target_agent 的技能包 content（L3+）
[5] rules_always  → trigger_type 为 always_active 的规则（预留，v6.4 无此类型）
[6] library       → <reference_documents> 块（L4+，≤8000 tokens）
[7] flow_constraints → 流程控制指令（L3+）
[8] task          → 当前具体任务描述（从 TaskDAG 取）
```

### 7.2 Share Slug 生成

```typescript
import { randomBytes } from 'node:crypto';

function generateShareSlug(): string {
  // 生成 8 位 URL 安全的随机字符串
  // 字符集：a-z 0-9（排除 0 和 o、1 和 l 等容易混淆的字符）
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(8);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

// 插入时处理碰撞（极低概率）
async function createProjectWithSlug(projectData: object): Promise<string> {
  let slug: string;
  let attempts = 0;

  do {
    slug = generateShareSlug();
    const { error } = await supabase.from('projects').insert({ ...projectData, share_slug: slug });
    if (!error) return slug;
    if (error.code !== '23505') throw error;  // 23505 = unique_violation
    attempts++;
  } while (attempts < 3);

  throw new Error('Failed to generate unique share slug after 3 attempts');
}
```

---

## 8. 边缘情况与不变量

### 8.1 并发构建防护

- 同一用户不能同时运行多个构建
- 收到 `start_build` 时检查：该用户是否有 `status='building'` 的 project 记录
- 如有，返回 WS 错误消息：`{ type: 'build_error', error_type: 'concurrent_build', message: '当前有构建正在进行' }`
- 实现：用 `Map<userId, ActiveBuild>` 在内存中追踪活跃构建

### 8.2 输出大小限制

- Agent 返回的 HTML 超过 200KB：截断至 200KB，添加注释 `<!-- 内容已截断 -->`，向前端发 Toast
- Library 注入总量超过 8000 tokens：按 created_at 倒序取，直到达到限制，丢弃剩余
- 图书馆单条粘贴超过 2000 字符：前端阻止提交（后端也校验，返回 400）
- 图书馆文件超过 500KB：multer 在 `limits.fileSize` 处理，返回 413

### 8.3 Draft 生命周期

| 事件 | Draft 行为 |
|------|-----------|
| 用户修改设计桌（防抖后） | UPSERT draft（spec_json 更新） |
| 用户点击"制定工作计划" | 不删除 draft |
| 用户点击"开始建造" | 不删除 draft（此时项目记录 status='building' 创建） |
| 构建被用户中断（stop_build） | 不删除 draft（用户回到设计桌可继续） |
| 构建成功（build_complete） | **删除 draft**（重新建造从空白开始） |
| 构建失败（不可恢复错误） | 不删除 draft |

**删除 draft 的代码位置：** `Orchestrator.ts` 内 `onBuildComplete` 回调。

### 8.4 Token 累计与成本

- 构建期间，每次 Agent 调用完成后，立即更新内存中的 `tokenUsage` 累计值
- 构建完成后，一次性写入 `projects.token_usage`
- **构建中不写数据库**（避免频繁小写操作）
- Token 计数来源：Anthropic SDK response 的 `usage.input_tokens` 和 `usage.output_tokens`

### 8.5 API Key 错误统一处理

| Anthropic API 错误码 | 前端表现 | 后端行为 |
|---------------------|---------|---------|
| 401 (invalid key) | BYOK 弹窗"许可证无效" | 发送 `build_error { error_type: 'invalid_api_key', recoverable: true }` |
| 429 (rate limit) | BYOK 弹窗"许可证无效" | 同上 |
| 529 (overloaded) | BYOK 弹窗"许可证无效" | 同上 |
| 500+ (server error) | BYOK 弹窗"许可证无效" | 同上 |
| 超时（>60s） | 工匠摇晃，重试/跳过按钮 | 自动重试 1 次（2s 后），仍失败发 `build_error { recoverable: true }` |

所有 401/429 类错误都统一表现为"许可证无效"，不区分"密钥错误"和"额度耗尽"（UX 决策）。

### 8.6 Library Refs 与项目的关联

- 文件上传时 `project_id = NULL`，`user_id + level` 标识归属
- `build_complete` 时：
  ```typescript
  await supabase
    .from('library_refs')
    .update({ project_id: newProject.id })
    .eq('user_id', userId)
    .eq('level', level)
    .is('project_id', null);
  ```
- 由于图书馆仅 L4 解锁，`level` 字段实际固定为 4，上述查询中 `.eq('level', level)` 等价于 `.eq('level', 4)`。
- 用户在同一关卡多次构建：每次构建都会覆盖关联（旧项目的 library_refs 通过 `ON DELETE SET NULL` 在项目被覆盖时清空 project_id）
- **并发安全说明：** 该更新操作在 `build_complete` 回调中执行，而并发构建已被 §8.1 的内存 Map 防护，同一用户同时只有一个活跃构建，因此不存在并发覆盖风险。

### 8.7 用户重新构建已完成关卡

- 从地图点击已完成建筑 → 选择"重新建造" → 进入空白设计桌（无草稿）
- 原项目记录**不删除**（分享链接继续有效）
- 新建造成功后：创建新的 project 记录，更新 `town_state` 中该关卡的 `project_id` 为新值
- 同一关卡可存在多条 projects 记录（历史记录）

### 8.8 `users` 表与 `auth.users` 表同步

- Supabase Auth 在 `auth.users` 创建记录，`public.users` 需手动创建
- 通过 Supabase Database Webhook 或后端注册逻辑同步
- **后端注册路由**（`/api/auth/register`）负责在 `auth.users` 创建成功后，立即在 `public.users` 插入对应记录
- `public.users.id` = `auth.users.id`（相同 UUID）
- 若 `public.users` 插入失败：回滚 `auth.users` 中的用户（调用 `supabase.auth.admin.deleteUser(id)`），返回 500

### 8.9 WS 连接与 Build Session 对应关系

- 每个 WS 连接对应一个 userId
- 服务端用 `Map<userId, { ws: WebSocket; orchestrator: Orchestrator }>` 管理活跃连接
- 同一用户新连接建立时，**关闭旧连接**（不等待旧构建完成；旧构建 status 更新为 'failed'）
- 前端刷新页面后重新建立 WS 连接，此时需重新点击"开始建造"

### 8.10 规则触发死循环防护

- `trigger_type = 'on_task_done'` 的规则，每个子任务最多触发 1 次
- `trigger_type = 'on_test_fail'` 的规则（通常触发重试），全局计数 ≤ 3 次
- Orchestrator 维护 `ruleFireCount: Map<ruleId, number>`，超限时跳过规则执行，向前端发 Toast

---

## 9. 环境变量清单

以下为后端 `server/.env` 的完整变量清单。详细说明见 TECH_STACK.md §9。

```dotenv
# 运行模式
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# AI 模型
MODEL_PROVIDER=claude          

# Supabase（三个 Key 都必填）
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...         # 仅用于代理 Supabase Auth 调用
SUPABASE_SERVICE_ROLE_KEY=eyJ... # 用于所有数据库/存储操作

# L3 预制 Plug
UNSPLASH_ACCESS_KEY=your_key
MAPBOX_ACCESS_TOKEN=pk.eyJ...

# L4 魔法连接
AMAP_KEY=your_amap_key
BAIDU_TRANSLATE_APPID=your_appid
BAIDU_TRANSLATE_SECRET=your_secret
JUHE_NEWS_KEY=your_juhe_key

# 成本计算（可选，有默认值）
USD_TO_RMB=7.3
```

**前端 `client/.env`（仅暴露 `VITE_` 前缀变量）：**

```dotenv
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

> **安全红线：** 任何 `SUPABASE_SERVICE_ROLE_KEY`、平台 API Key、用户 Claude API Key **绝对不能**出现在 `VITE_` 前缀变量中，也不能出现在任何前端代码里。

---

*文档结束。任何未在此定义的行为均视为需要向人类确认，AI 不得自行假设。*
