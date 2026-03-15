# CodeTown — Implementation Plan v1.0

> **文档说明：** 本文件是面向 Agent 的逐步构建指令序列。每个步骤均为独立的、可验证的构建单元。Agent 必须**按顺序**执行，不得跳步，不得在未完成前序步骤时开始后续步骤。
> **对应文档：** PRD v6.5 | BACKEND_STRUCTURE v1.0 | FRONTEND_GUIDELINES v1.0 | TECH_STACK v1.0
> **日期：** 2026-03-14

---

## 目录

1. [Phase 1 — 项目初始化与环境搭建](#phase-1--项目初始化与环境搭建)
2. [Phase 2 — 共享类型层](#phase-2--共享类型层-shared)
3. [Phase 3 — 数据库初始化](#phase-3--数据库初始化)
4. [Phase 4 — 前端基础设施](#phase-4--前端基础设施)
5. [Phase 5 — 前端：认证流程](#phase-5--前端认证流程)
6. [Phase 6 — 前端：小镇地图视图](#phase-6--前端小镇地图视图)
7. [Phase 7 — 前端：设计桌（Workspace）](#phase-7--前端设计桌-workspace)
8. [Phase 8 — 前端：工地视图（Construction）](#phase-8--前端工地视图-construction)
9. [Phase 9 — 前端：WebSocket 客户端](#phase-9--前端websocket-客户端)
10. [Phase 10 — 后端基础设施](#phase-10--后端基础设施)
11. [Phase 11 — 后端：AI 服务层](#phase-11--后端ai-服务层)
12. [Phase 12 — 后端：WebSocket 服务](#phase-12--后端websocket-服务)
13. [Phase 13 — 后端：Plug 与魔法连接](#phase-13--后端plug-与魔法连接)
14. [Phase 14 — 后端：其余 REST API 路由](#phase-14--后端其余-rest-api-路由)
15. [Phase 15 — 集成联调与部署](#phase-15--集成联调与部署)

---

## Phase 1 — 项目初始化与环境搭建

### 步骤 1.1：初始化 Monorepo 根目录

**目标：** 创建 monorepo 根目录，配置 Node 版本锁定与工作区。

**操作清单：**
1. 在根目录创建 `.nvmrc`，内容为 `22.14.0`
2. 在根目录创建 `.npmrc`，内容：
   ```
   save-exact=true
   engine-strict=true
   ```
3. 创建根 `package.json`（workspace 配置，见 TECH_STACK § 1）：
   - `name: "codetown"`，`private: true`
   - `workspaces: ["client", "server", "shared"]`
   - `engines: { "node": "22.14.0", "npm": "10.9.2" }`
   - `scripts.dev`：用 `concurrently` 同时启动 client 和 server
   - `scripts.build`：依次构建 shared → client → server
   - `devDependencies: { "concurrently": "9.1.2" }`
4. 创建 `.gitignore`（包含 `node_modules/`、`dist/`、`.env`、`*.env.local`）
5. 创建 `.env.example`（TECH_STACK §9 全量环境变量，值填 `your_xxx_here`）
6. 创建 `.prettierrc`（TECH_STACK §11.2 配置）

**验收标准：** `cat .nvmrc` 输出 `22.14.0`；`cat .npmrc` 包含 `save-exact=true`。

---

### 步骤 1.2：安装根级依赖

**目标：** 安装 monorepo 协调工具。

**操作清单：**
```bash
npm install --save-exact concurrently@9.1.2
```

**验收标准：** `node_modules/concurrently` 目录存在，`package-lock.json` 生成。

---

### 步骤 1.3：创建完整文件夹结构

**目标：** 按照 TECH_STACK §1 的目录树创建所有空目录和占位文件。

**需要创建的目录（含占位 `.gitkeep`）：**

```
client/
  public/fonts/
  public/audio/
  src/assets/icons/
  src/components/ui/
  src/components/map/
  src/components/workspace/
  src/components/construction/
  src/components/shared/
  src/hooks/
  src/lib/
  src/services/
  src/store/
  src/types/

server/
  src/routes/
  src/services/
  src/ws/
  src/utils/

shared/
  src/
```

**操作清单：**
1. 在 `client/` 根创建 `package.json`（TECH_STACK §3.8 完整清单，**版本号必须完全匹配**）
2. 在 `client/` 创建 `tsconfig.json` 和 `tsconfig.app.json`（TECH_STACK §3.9）
3. 在 `client/` 创建 `index.html`（标准 Vite HTML 模板，`<title>CodeTown</title>`，`charset="UTF-8"`）
4. 在 `server/` 创建 `package.json`（TECH_STACK §4.7 完整清单）
5. 在 `server/` 创建 `tsconfig.json`（TECH_STACK §4.8）
6. 在 `server/` 创建 `tsup.config.ts`（TECH_STACK §10.2）
7. 在 `shared/` 创建 `package.json`（TECH_STACK §5.2）

**验收标准：** `ls client/src/components/` 显示 `ui/ map/ workspace/ construction/ shared/` 五个目录。

---

### 步骤 1.4：安装全部依赖

**目标：** 一次性安装三个 workspace 的所有依赖。

**操作清单：**
```bash
npm install
```

运行后检查以下包是否存在（抽查）：
- `client/node_modules/react` — 版本 `19.0.0`
- `client/node_modules/tailwindcss` — 版本 `4.0.6`
- `server/node_modules/express` — 版本 `5.0.1`
- `server/node_modules/@anthropic-ai/sdk` — 版本 `0.37.0`

**验收标准：** `npm install` 零错误完成；`package-lock.json` 更新。

---

### 步骤 1.5：初始化 shadcn/ui

**目标：** 用 shadcn CLI 生成 CodeTown 所需的全部 UI 组件代码。

**操作清单：**（在 `client/` 目录下执行）
```bash
npx shadcn@2.3.0 init
npx shadcn@2.3.0 add button dialog tabs toast scroll-area tooltip label separator progress
```

初始化时选项：
- Style: **Default**
- Base color: 选任意（后续会被 Tailwind v4 CSS 变量覆盖）
- CSS variables: **Yes**

生成的组件将位于 `client/src/components/ui/`。

**验收标准：** `ls client/src/components/ui/` 包含 `button.tsx`、`dialog.tsx`、`tabs.tsx`、`toast.tsx` 等组件文件。

---

## Phase 2 — 共享类型层 (shared/)

### 步骤 2.1：定义共享 TypeScript 类型

**目标：** 创建前后端共同使用的类型定义，这是整个工程的类型基础，必须最先完成。

**文件：** `shared/src/types.ts`

**需包含的类型（严格按照 TECH_STACK §5.3 + PRD §2）：**

```typescript
// WebSocket 消息协议（服务端 → 客户端）
export type WsServerMessage =
  | { type: 'plan_complete'; dag: TaskDAG }
  | { type: 'task_started'; taskId: string; agentId: string }
  | { type: 'agent_chunk'; agentId: string; content: string }
  | { type: 'mirror_chunk'; agentId: string; content: string; isComplete: boolean }
  | { type: 'task_done'; taskId: string; teachingMomentId?: string }
  | { type: 'test_result'; passed: boolean; taskId: string }
  | { type: 'checkpoint'; taskId: string; preview: string }
  | { type: 'build_complete'; outputHtml: string; shareSlug: string }
  | { type: 'build_error'; message: string; recoverable: boolean };

// WebSocket 消息协议（客户端 → 服务端）
export type WsClientMessage =
  | { type: 'start_build'; projectSpec: ProjectSpec; apiKey: string }
  | { type: 'checkpoint_response'; taskId: string; action: 'approve' | 'modify'; note?: string }
  | { type: 'stop_build' };

// 项目规格（设计桌输出，结构与 BACKEND_STRUCTURE §2.2 完全一致）
export interface ProjectSpec {
  level: 1 | 2 | 3 | 4;
  brief: {
    text: string;
    project_type: 'website' | 'tool' | 'game' | 'app';
  };
  style: {
    visual_preset: string | null;
    visual_description: string;
    personality: string;
  };
  requirements: Requirement[];
  team: TeamConfig;
  skills: SpecSkill[];
  rules: SpecRule[];
  flow_control: FlowInstruction[];
  plugs: Plug[];
  library: LibraryItem[];
}

export interface Requirement {
  id: string;
  type: 'feature' | 'constraint' | 'when_then' | 'data';
  text: string;
  when?: string;
  then?: string;
}

export interface TeamConfig {
  agents: AgentConfig[];
}

export interface AgentConfig {
  type: 'planner' | 'builder' | 'tester' | 'reviewer';
  enabled: boolean;
  project_based_prompt: string;
}

export interface SpecSkill {
  skill_id: string;
  name: string;
  target_agent: 'builder' | 'tester' | 'reviewer' | 'all';
  content: string;
}

export interface SpecRule {
  rule_id: string;
  name: string;
  trigger_type: 'on_task_done' | 'on_test_fail' | 'before_deploy';
  content: string;
}

export interface LibraryItem {
  ref_id: string;
  source_type: 'file' | 'paste';
  original_name: string;
  extracted_text: string;
  token_count: number;
}

// Agent 类型
export type AgentType =
  | 'planner'
  | 'builder_structure'
  | 'builder_style'
  | 'builder_logic'
  | 'builder_skill'
  | 'tester'
  | 'reviewer';

// Task DAG
export interface TaskDAG {
  tasks: Task[];
  edges: { from: string; to: string }[];
}

export interface Task {
  id: string;
  name: string;
  agentType: AgentType;
  status: 'pending' | 'running' | 'done' | 'failed';
  teachingMomentId?: string;
}

// 魔法连接分类
export type MagicCategory = 'weather' | 'translate' | 'news' | 'unsupported';

// 流程控制
export type FlowInstruction = {
  id: string;
  instruction_type: 'sequence' | 'parallel' | 'iterate' | 'checkpoint';
  task_refs: string[];
};

// Plug（外部 API 连接）
export type Plug =
  | { id: string; plug_type: 'unsplash'; config: { keyword: string } }
  | { id: string; plug_type: 'mapbox'; config: { location: string } }
  | { id: string; plug_type: 'magic'; config: { description: string; magic_type?: MagicCategory } };
```

**文件：** `shared/src/index.ts`
```typescript
export * from './types';
```

**验收标准：** `cd shared && npx tsc --noEmit` 零错误通过。

---

## Phase 3 — 数据库初始化

### 步骤 3.1：在 Supabase 执行完整 SQL Schema

**目标：** 在 Supabase 控制台 SQL Editor 中依次运行所有建表语句。

**执行顺序：**（依赖顺序，不可乱序）

1. `users` 表 + 索引 + `update_updated_at_column()` 函数 + trigger + RLS（BACKEND_STRUCTURE §1.1）
2. `projects` 表 + 索引 + RLS（BACKEND_STRUCTURE §1.2）
3. `drafts` 表 + 索引 + trigger + RLS（BACKEND_STRUCTURE §1.3）
4. `skills` 表 + 索引 + RLS（BACKEND_STRUCTURE §1.4）
5. `rules` 表 + 索引 + RLS（BACKEND_STRUCTURE §1.5）
6. `library_refs` 表 + 索引 + RLS（BACKEND_STRUCTURE §1.6）
7. 所有 CREATE INDEX
8. 所有 ALTER TABLE ... ENABLE ROW LEVEL SECURITY
9. 所有 CREATE POLICY
10. Seed 数据（见步骤 3.2）

**验收标准：** 在 Supabase 控制台 Table Editor 中可看到**六张表**（users、projects、drafts、skills、rules、library_refs）；尝试直接用 `anon_key` 查询 `users` 表应返回 RLS 权限错误（`policy violation`）。

---

### 步骤 3.2：Seed 内置技能包和规则数据

**目标：** 插入 PRD §2.5-2.6 中定义的内置模板。

**技能包 Seed（`user_id = NULL, is_builtin = TRUE`）：**

| name | target_agent | content |
|------|-------------|---------|
| 📱 响应式布局 | builder | "确保所有布局在 320px-1280px 宽度下均正常显示，使用 CSS flexbox 或 grid，不使用固定像素宽度。" |
| 🌙 暗黑模式 | builder | "为界面添加暗黑模式支持，使用 CSS 变量切换颜色方案，默认跟随系统偏好。" |
| ♿ 无障碍设计 | builder | "所有交互元素必须有 aria-label，图片必须有 alt 文字，颜色对比度满足 WCAG AA 标准。" |
| 💬 代码注释 | builder | "每个函数和复杂逻辑块必须有中文注释，解释其功能和参数。" |
| 🛡️ 代码整洁 | all | "代码必须格式整齐、变量命名清晰（使用中文拼音或英文），不留调试 console.log。" |

**规则 Seed（`user_id = NULL, is_builtin = TRUE`）：**

| name | trigger | content |
|------|---------|---------|
| 🔄 测试失败自动重试 | on_test_fail | "当测试失败时，自动重试最多 3 次，每次重试时分析失败原因并针对性修复。" |
| 📋 任务完成后代码审查 | on_task_done | "每完成一个任务，由审查者检查代码质量，确认无明显 bug 后再继续下一任务。" |
| 🛡️ 部署前安全检查 | before_deploy | "部署前检查：无硬编码密钥、无 XSS 漏洞、所有用户输入已做转义处理。" |

**验收标准：** `SELECT count(*) FROM skills WHERE is_builtin = TRUE` 返回 `5`；`SELECT count(*) FROM rules WHERE is_builtin = TRUE` 返回 `3`。

---

### 步骤 3.3：创建 Supabase Storage Bucket

**目标：** 在 Supabase Dashboard 中创建图书馆文件上传所需的 Storage Bucket（BACKEND_STRUCTURE §6.1）。

**操作步骤：**

在 Supabase Dashboard > Storage > New bucket 中创建，配置如下：

| 配置项 | 值 |
|--------|----|
| Bucket 名称 | `library-uploads` |
| Public | **关闭**（Private，不公开访问） |
| 文件大小限制 | `512000`（500KB，单位 bytes） |
| 允许的 MIME 类型 | `text/plain`, `text/markdown`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

**文件路径规范（BACKEND_STRUCTURE §6.2）：**

上传文件时路径格式必须严格为：`library-uploads/{userId}/{level}/{uuid}_{originalFilename}`

- `{userId}`：当前用户的 UUID
- `{level}`：关卡编号（固定为 `4`，图书馆仅 L4 解锁）
- `{uuid}`：用 `crypto.randomUUID()` 生成，防止同名文件冲突
- `{originalFilename}`：原始文件名（保留用于展示）

**验收标准：** 在 Supabase Dashboard > Storage 中可看到 `library-uploads` bucket；尝试通过 `anon_key` 直接访问 bucket 内文件应返回 403 权限错误。

---

## Phase 4 — 前端基础设施

### 步骤 4.1：配置 Vite + Tailwind v4

**目标：** 完成 Vite 构建工具配置（含 Tailwind v4 Vite 插件、路径别名、API 代理）。

**文件：** `client/vite.config.ts`（完整内容见 TECH_STACK §10.1）

关键配置点：
- `plugins: [react(), tailwindcss()]`（**不使用** `postcss.config.js`）
- `resolve.alias: { '@': path.resolve(__dirname, 'src') }`
- `server.proxy`: `/api` → `http://localhost:3001`；`/ws` → `ws://localhost:3001`（ws: true）
- `build.rollupOptions.output.manualChunks`：将 react、dndkit、radix 分包

**验收标准：** `npm run dev -w client` 启动，浏览器打开 `http://localhost:5173` 无控制台错误。

---

### 步骤 4.2：配置 Tailwind v4 设计令牌（CSS 变量）

**目标：** 在 `client/src/index.css` 中建立完整的设计令牌系统，这是所有组件的视觉基础。

**文件：** `client/src/index.css`

**必须包含的内容（严格按照 FRONTEND_GUIDELINES §2 + §3 + §4 + §5 + §12）：**

```css
@import "tailwindcss";

@theme {
  /* === 品牌主色 === */
  --color-primary: #3385FF;
  --color-secondary: #29665B;
  --color-accent: #E5594F;

  /* === 背景层次 === */
  --bg-base: #F8F2E2;
  --bg-surface: #FFFDF7;
  --bg-blueprint: #E8F4FD;
  --bg-overlay: rgba(34, 34, 34, 0.55);

  /* === 九大组件强调色 === */
  --comp-brief: #3385FF;
  --comp-style: #C760A8;
  --comp-req: #4CAF50;
  --comp-agent: #ED6D57;
  --comp-skill: #F2C84B;
  --comp-rule: #29665B;
  --comp-flow: #9C27B0;
  --comp-plug: #00BCD4;
  --comp-library: #795548;

  /* === 语义状态色 === */
  --color-success: #4CAF50;
  --color-warning: #FFC107;
  --color-error: #F44336;
  --color-active: #3385FF;
  --color-locked: #9E9E9E;
  --color-tm: #9C27B0;

  /* === 中性文字色 === */
  --text-primary: #1A1A1A;
  --text-secondary: #5A5A5A;
  --text-placeholder: #AAAAAA;
  --text-disabled: #CCCCCC;
  --color-divider: #E8E2D4;

  /* === 字体 === */
  --font-family-base: 'OPPOSans', 'OPPO Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

  /* === 间距（8px 基准网格）=== */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;

  /* === 圆角 === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}

/* === OPPOSans 字体声明 === */
@font-face {
  font-family: 'OPPOSans';
  src: url('/fonts/OPPOSans-R.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'OPPOSans';
  src: url('/fonts/OPPOSans-M.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'OPPOSans';
  src: url('/fonts/OPPOSans-B.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* === 全局基础样式 === */
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background-color: var(--bg-base);
  font-family: var(--font-family-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  min-width: 1280px; /* 仅桌面端，PRD §1.4 */
}

/* === 全局动画关键帧（FRONTEND_GUIDELINES §9）=== */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(51, 133, 255, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(51, 133, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(51, 133, 255, 0); }
}
@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**验收标准：** 在浏览器 DevTools 中，`document.body` 的背景色为 `#F8F2E2`，字体为 OPPOSans。

---

### 步骤 4.3：创建 `lib/utils.ts`

**目标：** 创建 shadcn/ui 的 `cn()` helper。

**文件：** `client/src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**验收标准：** 文件存在，无 TypeScript 错误。

---

### 步骤 4.4：创建 `main.tsx` 和 `App.tsx` 骨架

**目标：** 建立 React 19 应用入口和路由骨架。

**路由方案说明（APP_FLOW §9 + TECH_STACK 禁止清单）：** 内部主流程（登录、小镇地图、设计桌、工地）使用 React state 控制视图切换，**不使用 react-router-dom**。但分享链接（`/p/:slug`、`/u/:name`）需要 URL 支持，使用 **`wouter@3.3.5`** 处理这两个公开路由。

**文件：** `client/src/main.tsx`
```tsx
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router, Route, Switch } from 'wouter'
import App from './App'
import SharePage from './components/shared/SharePage'
import TownPublicPage from './components/shared/TownPublicPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Switch>
        {/* 分享路由：由 wouter 处理，无需登录 */}
        <Route path="/p/:slug" component={SharePage} />
        <Route path="/u/:name" component={TownPublicPage} />
        {/* 内部主流程：由 App 的 React state 状态机控制 */}
        <Route component={App} />
      </Switch>
    </Router>
  </StrictMode>
)
```

**文件：** `client/src/App.tsx`

App 的视图状态机（`view` state）：
- `'login'` → 登录/注册页
- `'byok'` → BYOK API Key 输入弹窗（在 town 视图上方覆盖）
- `'town'` → 小镇地图
- `'workspace'` → 设计桌 + 工地（传入 `level: 1|2|3|4`）

骨架代码：
```tsx
import { useState } from 'react'

// 内部主流程视图（用 React state 控制）
type View = 'login' | 'town' | 'workspace' | 'byok'
// 注：/p/:slug 和 /u/:name 分享路由由 wouter 在 main.tsx 层处理，不进入此 View 状态机

export default function App() {
  const [view, setView] = useState<View>('login')
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 4>(1)

  if (view === 'login') return <div>登录页（待实现）</div>
  if (view === 'town') return <div>小镇地图（待实现）</div>
  if (view === 'workspace') return <div>设计桌/工地（待实现）</div>
  return null
}
```

**验收标准：** `npm run dev -w client` 启动后，页面显示「登录页（待实现）」文字，无控制台错误。

---

## Phase 5 — 前端：认证流程

### 步骤 5.1：登录/注册页面组件

**目标：** 构建登录/注册双模式页面。PRD §1.4 要求：**无游客模式**，进入小镇必须登录。

**文件：** `client/src/components/shared/AuthPage.tsx`

**视觉规范（FRONTEND_GUIDELINES §8.x）：**
- 背景色：`var(--bg-base)`（米色）
- 居中卡片：白色（`var(--bg-surface)`），`border-radius: var(--radius-xl)`，`padding: 40px`
- 卡片宽度：`480px`，无阴影（扁平化铁律）
- CodeTown 标题：字号 32px，font-weight 700，颜色 `var(--color-primary)`
- 副标题：「建设你的小镇，学会 Vibe Coding」，字号 14px，`var(--text-secondary)`

**表单字段：**
- Tab 切换：「邮箱登录」/ 「手机号登录」（使用 shadcn Tabs 组件）
- 邮箱模式：邮箱 input + 密码 input
- 手机号模式：手机号 input（placeholder: `13800138000`）+ 密码 input
- 主 CTA 按钮：「进入小镇」（登录）/ 「注册账号」，颜色 `var(--color-primary)`，`border-radius: var(--radius-lg)`，高度 48px

**API 调用：**
- `POST /api/auth/login` → `{ identifier, password }` → `{ access_token, refresh_token, user }`
- `POST /api/auth/register` → `{ email?, phone?, password, display_name? }` → `{ access_token, refresh_token, user }`
- 成功后将 token 存入 React state + sessionStorage，将 user 存入 React state，切换视图到 `'town'`

**验收标准：** 点击「进入小镇」按钮时，发起正确的 POST 请求；登录成功后视图切换为 town。

---

### 步骤 5.2：BYOK Modal（API Key 输入）

**目标：** 构建「建筑许可证」API Key 输入弹窗。在用户点击「开始建造」前检测，若无 Key 则弹出。

**文件：** `client/src/components/shared/BYOKModal.tsx`

**交互逻辑（PRD §9.x + TECH_STACK §6.1）：**
- 使用 shadcn Dialog 组件
- 标题：「🔑 获取建筑许可证」
- 说明文字：「在 CodeTown 建造项目需要 Opencode API Key。你的 Key 仅在本次会话中使用，关闭标签页即清除，不会上传到服务器。」
- 输入框：type="password"，placeholder="sk-..."
- 确认按钮：「获取许可证，开始建造！」

**Key 存储规则（严格遵守 TECH_STACK §6.1）：**
- Key 原文存入 `sessionStorage`（`key: 'ct_api_key'`）和 React state
- **绝对不存入** `localStorage`，不发送到后端存储
- 后端接收后仅用于单次请求，计算 SHA-256 hash 后存 `users.api_key_hash`
- 前端校验 `sk-` 前缀（Opencode API Key，与 PRD §14.1 BYOK-2 一致）

**验收标准：** 输入 Key 后点击确认，`sessionStorage.getItem('ct_api_key')` 返回该 Key；`localStorage` 中无 Key。输入不以 `sk-` 开头的内容会提示格式错误。

---

## Phase 6 — 前端：小镇地图视图

### 步骤 6.1：小镇地图主布局

**目标：** 构建全局导航栏 + 小镇地图视图框架。

**文件：** `client/src/components/map/TownMap.tsx`

**布局结构（FRONTEND_GUIDELINES §7）：**
```
┌─────────────────────────────────────────────┐
│  全局导航栏（高度 48px，固定顶部）              │
├─────────────────────────────────────────────┤
│                                             │
│  小镇地图（flex-1，米色底色 #F8F2E2）          │
│  4 栋建筑按关卡排列                           │
│                                             │
└─────────────────────────────────────────────┘
```

**全局导航栏内容（`client/src/components/shared/TopNav.tsx`）：**
- 左侧：「🏘️ CodeTown」Logo（字号 18px，Bold，`--color-primary`）
- 右侧：Token 使用量显示（「¥0.28」格式，`--text-secondary`）+ 用户昵称 + 音效开关图标

---

### 步骤 6.2：建筑组件（4 个关卡建筑）

**目标：** 构建小镇中 4 栋建筑的卡片组件，反映各自的状态（锁定/可进入/完成）。

**文件：** `client/src/components/map/BuildingCard.tsx`

**Props：**
```typescript
interface BuildingCardProps {
  level: 1 | 2 | 3 | 4;
  status: 'locked' | 'unlocked' | 'completed';
  projectName?: string;
  onClick: () => void;
}
```

**视觉规范（FRONTEND_GUIDELINES §2.5）：**
- L1 面包店：屋顶色 `#5A9BD5`（柔蓝）
- L2 游戏厅：屋顶色 `#4A9E8F`（柔绿）
- L3 我的家：外墙色 `#E8946A`（柔橙）
- L4 新闻看板：外墙色 `#F5D76E`（柔黄）
- 锁定状态：整体变为 `#C5C5C5`（浅灰），显示 🔒 图标
- 完成状态：右上角显示绿色 ✅ 徽章
- Hover 效果：`transform: translateY(-4px)`，2px offset 纯色阴影（铁律唯一例外）

**建筑名称对应：**
| 关卡 | 建筑名 | 描述 |
|------|--------|------|
| L1 | 面包店 | 第一个完整项目 |
| L2 | 游戏厅 | 引入测试者 |
| L3 | 我的家 | 解锁技能/规则/流程/Plug |
| L4 | 新闻看板 | 解锁图书馆 + 魔法连接 |

**验收标准：** 4 栋建筑显示正确颜色；locked 建筑显示锁图标；点击 unlocked 建筑触发 `onClick`。

---

### 步骤 6.3：关卡解锁逻辑

**目标：** 根据 `users.town_state` 判断建筑状态，完成 L1 后解锁 L2，依此类推。

**文件：** `client/src/hooks/useTownState.ts`

**逻辑规则（PRD §5 + BACKEND_STRUCTURE §2.1）：**
- 从 `GET /api/user/me` 获取 `townState`
- `townState.buildings[i].status` 决定 `BuildingCard` 的 `status` prop
- 点击 `unlocked` 建筑 → 导航到 `workspace` 视图，传入对应 `level`
- 点击 `locked` 建筑 → 显示 Toast：「完成第 N 关后解锁」

**验收标准：** 初始状态 L1 可点击进入，L2-L4 显示锁定。

---

## Phase 7 — 前端：设计桌（Workspace）

### 步骤 7.1：设计桌主布局（三栏结构）

**目标：** 构建设计桌整体布局——左栏文件夹 + 中栏图纸 + 右上角 Tab。

**文件：** `client/src/components/workspace/WorkspaceView.tsx`

**布局规范（FRONTEND_GUIDELINES §7 + PRD §3.2）：**
```
[ 🗒️ 设计桌 ]  [ 🏗️ 工地(灰) ]   ← 右上角 Tab（使用 shadcn Tabs）
┌──────────┬────────────────────────┐
│ 文件夹   │  木纹桌面（固定）         │
│ (200px)  │  ┌──────────────────┐  │
│          │  │ 设计图纸（滚动）   │  │
│          │  │ 蓝色网格底色      │  │
│          │  └──────────────────┘  │
└──────────┴────────────────────────┘
```

**木纹桌面（FRONTEND_GUIDELINES §8.3）：**
```css
background:
  radial-gradient(ellipse at 30% 40%, #B8966A 1px, transparent 1px),
  radial-gradient(ellipse at 70% 60%, #B8966A 1px, transparent 1px),
  #C8A96E;
background-size: 60px 60px, 80px 80px, auto;
```

**Tab 切换规则（PRD §3.2）：**
- 初始：「设计桌」Tab 激活，「工地」Tab 灰色不可点击
- 点击「开始建造」后：「工地」Tab 变为可点击，自动切换到工地视图
- 建造中：两个 Tab 可自由切换，但设计桌内容变为只读

**验收标准：** 布局宽度 ≥1280px，左栏 200px，中栏填满剩余空间，Tab 切换正常工作。

---

### 步骤 7.2：文件夹组件系统

**目标：** 构建左栏的 9 个彩色文件夹，按关卡渐进解锁。

**文件：** `client/src/components/workspace/FolderPanel.tsx`
**文件：** `client/src/components/workspace/ComponentFolder.tsx`

**文件夹视觉规范（FRONTEND_GUIDELINES §2.3）：**
- 每个文件夹：左边框 4px，颜色为对应组件强调色（`--comp-*`）
- 顶部色条：6px 高，颜色同上
- Hover 背景：对应颜色 10% opacity
- 锁定状态：灰色 `#9E9E9E`，显示 🔒 + "第X关解锁"文字

**9 个文件夹的解锁关卡：**
| 文件夹 | 颜色变量 | 首次解锁 |
|--------|----------|---------|
| 📋 委托单 | `--comp-brief` | L1 |
| 🎨 装修方案 | `--comp-style` | L1 |
| 📝 需求清单 | `--comp-req` | L1 |
| 🤖 工匠团队 | `--comp-agent` | L1（L2 可配置）|
| 🎒 技能包 | `--comp-skill` | L3 |
| 📜 规则系统 | `--comp-rule` | L3 |
| 🔀 流程控制 | `--comp-flow` | L3 |
| 🔌 Plug | `--comp-plug` | L3 |
| 📚 图书馆 | `--comp-library` | L4 |

**文件夹展开行为：** 点击文件夹标签 → 展开显示预设模板卡片列表 + 「+ 自定义」选项。

**验收标准：** L1 视图下，前 4 个文件夹可展开，后 5 个显示锁定状态。

---

### 步骤 7.3：设计图纸 + 卡槽系统

**目标：** 构建图纸区域，包含按关卡变化的卡槽布局。

**文件：** `client/src/components/workspace/BlueprintCanvas.tsx`
**文件：** `client/src/components/workspace/CardSlot.tsx`

**图纸背景（FRONTEND_GUIDELINES §2.2）：**
```css
background-color: var(--bg-blueprint); /* #E8F4FD */
background-image:
  linear-gradient(rgba(51, 133, 255, 0.15) 1px, transparent 1px),
  linear-gradient(90deg, rgba(51, 133, 255, 0.15) 1px, transparent 1px);
background-size: 24px 24px;
```

**四个关卡的卡槽数量（PRD §3）：**
| 关卡 | 必填卡槽 | 可选卡槽 | 总计 |
|------|---------|---------|------|
| L1 | 委托单、装修方案、需求清单 | — | 3 |
| L2 | +工匠团队（可配置）| — | 4 |
| L3 | +技能包、规则系统、流程控制、Plug | 各可选 | 8 |
| L4 | +图书馆 | — | 9 |

**`CardSlot` 的三种状态：**
- `required`：实线边框 + 脉冲光圈动画（`animation: pulse-ring 2s infinite`）
- `optional`：虚线边框，`border: 2px dashed var(--color-divider)`
- `locked`：灰色底 + 🔒 + 小字「第X关解锁」

**拖入交互：** 当正确组件类型拖入匹配卡槽时，卡槽高亮（`border-color: var(--color-primary)`）并磁吸入位。

**图纸顶部 sticky 概要栏：** 显示「项目名称 · 类型 · 已填 N/M 项」，白底，`padding: 12px 16px`。

**验收标准：** L1 图纸显示 3 个卡槽（2 实线 + 1 实线），拖入正确组件后卡槽变为已填状态。

---

### 步骤 7.4：卡片组件（9 种组件卡片）

**目标：** 实现 9 种组件对应的卡片 UI，每种卡片有独特的表单字段。

每张卡片的通用视觉规范（FRONTEND_GUIDELINES §8）：
- 顶部色条：6px 高，颜色为对应组件强调色
- 背景：`var(--bg-surface)`（象牙白）
- 圆角：`var(--radius-lg)`（12px）
- Hover：`transform: translateY(-2px)`，2px offset 纯色阴影

---

#### 步骤 7.4.1：委托单卡片

**文件：** `client/src/components/workspace/cards/BriefCard.tsx`

**字段：**
- 项目名称 input（placeholder: 「我的面包店网站」）
- 项目类型 select（网站 / 工具 / 游戏 / 应用）
- 项目描述 textarea（placeholder: 「描述你想要做什么...」，最多 200 字）

---

#### 步骤 7.4.2：装修方案卡片

**文件：** `client/src/components/workspace/cards/StyleCard.tsx`

**字段：**
- 外观预设：4 张缩略图卡片（温馨手绘 / 科技感 / 简约白 / 深色炫酷），选中高亮边框
- 性格文本框（placeholder: 「友善、活泼、充满创意...」）

---

#### 步骤 7.4.3：需求清单卡片

**文件：** `client/src/components/workspace/cards/RequirementsCard.tsx`

**四种子类型（按关卡解锁）：**
- L1 解锁：功能需求（绿色 `--comp-req`，placeholder: 「用户可以...」）
- L2 解锁：约束需求（橙色，placeholder: 「不能超过 3 张图片」）
- L2 解锁：当/则规则（蓝色，placeholder: 「当用户点击按钮时，则...」）
- L4 解锁：数据需求（棕色，placeholder: 「需要显示真实天气数据」）

每种类型支持多条，有「+ 添加一条」按钮。

---

#### 步骤 7.4.4：工匠团队卡片

**文件：** `client/src/components/workspace/cards/AgentTeamCard.tsx`

**四个工匠（PRD §2.4）：**
- 📐 规划者（小策）- 鲑鱼粉上衣 `#EF7267`
- 🏗️ 建造者（小匠）- 亮蓝上衣 `#3385FF`
- 🧪 测试者（小检）- 深松石绿上衣 `#29665B`
- 📋 审查者（小审）- 紫粉上衣 `#C760A8`

**L1 行为：** 规划者+建造者固定显示，不可修改，无勾选框。
**L2 行为：** 四个工匠均有 toggle（默认勾选前三），用户可增减。
**L3+ 行为：** 完全自由，每个工匠卡片可展开填写 `project-based prompt` 文本框。

---

#### 步骤 7.4.5：技能包卡片（L3）

**文件：** `client/src/components/workspace/cards/SkillsCard.tsx`

**字段：**
- 目标工匠 select（建造者 / 测试者 / 审查者 / 全部）
- 技能内容 textarea
- 内置模板快速选择区（5 个模板按钮，点击填充内容）
- 支持添加多条技能（「+ 添加技能」按钮）

---

#### 步骤 7.4.6：规则系统卡片（L3）

**文件：** `client/src/components/workspace/cards/RulesCard.tsx`

**字段：**
- 触发时机 select（任务完成时 / 测试失败时 / 部署前）
- 规则内容 textarea
- 内置模板 3 个（点击填充）
- 支持添加多条规则

---

#### 步骤 7.4.7：流程控制卡片（L3）

**文件：** `client/src/components/workspace/cards/FlowControlCard.tsx`

**字段（PRD §2.7 卡片结构）：**
- 指令类型 select（先后 / 同时进行 / 持续改进 / 让我看看）
- 任务列表（动态增减，每条从需求清单中选择）
- `+/-` 按钮增减任务数量

---

#### 步骤 7.4.8：Plug 卡片（L3 预制 + L4 魔法连接）

**文件：** `client/src/components/workspace/cards/PlugCard.tsx`

**L3 预制 Plug 类型：**
- 🖼️ 图片素材（Unsplash）：关键词 input
- 🗺️ 地图（Mapbox）：地点 input

**L4 新增：**
- 🪄 魔法连接：自由描述 textarea（placeholder: 「描述你想要什么外部信息，如'上海今天的天气'」）

支持添加多个 Plug（每种类型各一个）。

---

#### 步骤 7.4.9：图书馆卡片（L4）

**文件：** `client/src/components/workspace/cards/LibraryCard.tsx`

**两种输入（PRD §2.9）：**
- 粘贴文本区：单条 ≤2000 字符，支持多条，显示已用字符数
- 上传文件区（拖拽/点击）：`accept=".txt,.md,.doc,.docx"`，单文件 ≤500KB，使用 shadcn ScrollArea 展示已上传列表

**验收标准（7.4 总体）：** 所有卡片在对应关卡下可正常填写，数据存入本地 state。

---

### 步骤 7.5：拖放系统（dnd-kit）

**目标：** 实现文件夹卡片 → 图纸卡槽的磁吸拖放。

**文件：** `client/src/components/workspace/DndWrapper.tsx`

**实现规范（TECH_STACK §3.4）：**
- 使用 `DndContext` + 自定义 `DragOverlay`
- `draggable`：文件夹中的每张卡片模板
- `droppable`：图纸上的每个卡槽（携带允许的组件类型信息）
- 类型校验：拖错类型的卡片至卡槽 → 无反应（不高亮、不吸入）
- 拖入正确卡槽 → 卡槽高亮，松手后卡片吸入，文件夹中对应选项变为「已添加」状态

**验收标准：** 将委托单卡片从文件夹拖入委托单卡槽，卡槽变为已填状态，图纸概要计数 +1。

---

### 步骤 7.6：底部按钮 + Meta Planner 触发

**目标：** 实现「制定工作计划」→「开始建造」两阶段按钮流。

**文件：** `client/src/components/workspace/WorkspaceFooter.tsx`

**阶段一：「📐 制定工作计划」按钮**
- 触发条件：所有必填卡槽已填写
- 未满足时：灰色禁用状态
- 点击后：调用 `POST /api/meta-plan`，传入当前 `ProjectSpec`
- 加载状态：按钮显示「规划中...」+旋转图标，图纸卡片显示「整理中」动画
- 成功后：卡片按卡槽从上到下重新排序整齐（`bounce-in` 动画），按钮文字变为「🚀 开始建造」

**阶段二：「🚀 开始建造」按钮**
- 点击后：检查 `sessionStorage` 中是否有 API Key
  - 无 Key → 弹出 BYOKModal
  - 有 Key → 建立 WebSocket 连接，发送 `start_build` 消息，切换到工地 Tab

**验收标准：** 填写所有必填卡槽后，按钮由灰变蓝；点击「制定工作计划」触发 API 调用；点击「开始建造」时无 Key 弹出 BYOK Modal。

---

## Phase 8 — 前端：工地视图（Construction）

### 步骤 8.1：工地主布局（左右分栏 65/35）

**目标：** 构建工地整体框架（PRD §3.2 + v6.4 更新摘要第4条）。

**文件：** `client/src/components/construction/ConstructionView.tsx`

**布局规范：**
```
┌────────────────────────────┬──────────────┐
│  工匠工位区（Agent 65%）    │ Mirror（35%） │
│                            │              │
│  [工位卡片传送带]           │  [气泡流]    │
│                            │              │
└────────────────────────────┴──────────────┘
```

- 左栏：`width: 65%`，背景 `var(--bg-base)`，显示工位卡片
- 右栏：`width: 35%`，背景 `var(--bg-surface)`，显示 Mirror 气泡流
- 右栏使用 shadcn ScrollArea，新消息自动滚动到底部

---

### 步骤 8.2：工匠工位卡片（含 TM 翻转交互）

**目标：** 构建每个工匠 Agent 的工位卡片，包含状态展示与 Teaching Moment 翻转。

**文件：** `client/src/components/construction/AgentWorkstation.tsx`
**文件：** `client/src/components/construction/TeachingMomentCard.tsx`

**工位卡片状态（PRD §9.x）：**

| 状态 | 视觉 | 动画 |
|------|------|------|
| `pending` | 灰色，工匠插画透明度 50% | 无 |
| `running` | 蓝色边框，`--color-primary` | 工匠上下浮动 `float 2s infinite` |
| `done` | 绿色边框，✅ 徽章 | `bounce-in` 入场 |
| `failed` | 红色边框，❌ 徽章 | `shake 0.5s` |

**Teaching Moment（TM）翻转卡片（PRD v6.4 更新第2条）：**
- 工位完成后，若有 `teachingMomentId`，工位右上角显示 💡 图标（`--color-tm` 紫色，pulse 动画）
- **Hover**（桌面端）/ **长按**（触屏）→ 卡片 3D 翻转（CSS `transform: rotateY(180deg)`，`transition: 0.4s`）
- 背面内容：教学知识点（从预设的 TM 数据库中按 `teachingMomentId` 查找）
- TM 背面样式：`--color-tm` 边框，白色底，标题「💡 你刚刚学到了」

**Teaching Moment 预设数据（`client/src/lib/teachingMoments.ts`，共 9 条，对应 9 个概念）：**
```typescript
export const TEACHING_MOMENTS = {
  'system-prompt': { title: '系统提示词', content: '你刚才写的委托单，就是 AI 的系统提示词...' },
  'multi-agent': { title: '多 Agent 协作', content: '规划者拆分任务，建造者执行...' },
  // ... 其余 7 条
}
```

**验收标准：** 接收到 `task_done` WebSocket 消息后，对应工位变为 done 状态；若有 TM，hover 时卡片翻转。

---

### 步骤 8.3：Mirror 面板（LLM 流式输出气泡）

**目标：** 构建右侧 Mirror 面板，实时显示各工匠的 LLM 流式输出（PRD v6.4 更新第3条）。

**文件：** `client/src/components/construction/MirrorPanel.tsx`
**文件：** `client/src/components/construction/MirrorBubble.tsx`

**气泡规范：**
- 每个 `mirror_chunk` 消息追加内容到当前 Agent 的气泡中（流式拼接）
- `isComplete: true` 时，气泡底部显示「✓ 完成」标记
- 气泡左侧显示对应工匠的颜色小点（规划者=`#EF7267`，建造者=`#3385FF` 等）
- 气泡文字字号 13px，`--text-secondary`，行高 1.6
- 代码片段：`font-family: monospace`，背景 `#F0F0F0`，`border-radius: 4px`

**验收标准：** 接收到 `mirror_chunk` 时，气泡内容实时更新；新气泡出现时自动滚动到底部。

---

### 步骤 8.4：揭幕时刻（iframe 沙盒预览 + confetti）

**目标：** 构建构建完成后的揭幕展示页面（PRD §9.x + TECH_STACK §10.3）。

**文件：** `client/src/components/construction/RevealMoment.tsx`

**触发时机：** 收到 `build_complete` WebSocket 消息。

**视觉流程：**
1. 工地视图中，工位传送带下方出现大型遮罩区域（珊瑚红边框，`--color-accent`）
2. 「🎉 揭幕！」按钮（珊瑚红背景）出现
3. 点击后：
   - 触发 `canvas-confetti`（彩带从顶部落下）
   - 播放 `new Audio('/audio/snap.mp3').play()`
   - 遮罩打开，展示 iframe

**iframe 安全配置（严格遵守 TECH_STACK §10.3）：**
```tsx
<iframe
  srcDoc={outputHtml}
  sandbox="allow-scripts allow-same-origin"
  style={{ width: '100%', height: '500px', border: 'none', borderRadius: '12px' }}
/>
```

**揭幕后按钮区：**
- 「🔗 分享链接」→ 复制 `codetown.app/p/{shareSlug}` 到剪贴板
- 「🔄 重新建造」→ 清空草稿，返回设计桌
- 「🏘️ 回到小镇」→ 返回 town 视图（若已解锁下一关，建筑状态更新）

**验收标准：** `build_complete` 消息到达时，揭幕按钮出现；点击后 confetti 播放，iframe 正确显示生成的 HTML。

---

## Phase 9 — 前端：WebSocket 客户端

### 步骤 9.1：WebSocket 服务封装

**目标：** 封装 WebSocket 连接管理，处理重连、消息路由、连接状态。

**文件：** `client/src/services/websocket.ts`

**接口设计：**
```typescript
export class WebSocketService {
  private ws: WebSocket | null = null

  connect(token: string): void
  disconnect(): void
  send(msg: WsClientMessage): void

  // 事件回调（供组件注册）
  onMessage: (msg: WsServerMessage) => void = () => {}
  onOpen: () => void = () => {}
  onClose: () => void = () => {}
  onError: (err: Event) => void = () => {}
}

export const wsService = new WebSocketService()
```

**连接 URL：** `${import.meta.env.VITE_WS_URL}/ws?token=${token}`

**重连策略：** 非主动断开时，3 秒后自动重连，最多重试 3 次，之后显示 Toast 错误。

**验收标准：** `wsService.connect(token)` 后，`wsService.send({ type: 'stop_build' })` 能发出消息，服务端收到。

---

### 步骤 9.2：构建状态全局 Store

**目标：** 用 React state（无 Redux/Zustand）管理工地的实时构建状态。

**文件：** `client/src/store/buildStore.ts`

使用 React `useReducer` 模式，管理：
- `tasks: Task[]`（Task DAG 中各任务的状态）
- `mirrorBubbles: MirrorBubble[]`（Mirror 面板的气泡数组）
- `buildStatus: 'idle' | 'planning' | 'building' | 'complete' | 'failed'`
- `outputHtml: string | null`
- `shareSlug: string | null`
- `tokenUsage: TokenUsage`

**验收标准：** 接收 `plan_complete` 消息后，`tasks` state 更新为 DAG 中的任务列表。

---

## Phase 10 — 后端基础设施

### 步骤 10.1：Express 5 服务器入口

**目标：** 创建 Express 5 服务器，配置中间件，注册所有路由。

**文件：** `server/src/index.ts`

**结构规范：**
```typescript
import 'dotenv/config'  // 必须在最顶部，第一行
import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { setupWebSocket } from './ws/wsHandler'
import authRouter from './routes/auth'
import projectsRouter from './routes/projects'
import draftsRouter from './routes/drafts'
import skillsRouter from './routes/skills'
import plugRouter from './routes/plug'
import libraryRouter from './routes/library'

const app = express()
const httpServer = createServer(app)

// 中间件
app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json({ limit: '1mb' }))

// 健康检查（Railway 需要）
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// 路由
app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/drafts', draftsRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/plug', plugRouter)
app.use('/api/library', libraryRouter)

// WebSocket
setupWebSocket(httpServer)

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

**验收标准：** `npm run dev -w server` 启动，`curl http://localhost:3001/health` 返回 `{"status":"ok"}`。

---

### 步骤 10.2：Supabase 客户端初始化

**目标：** 创建后端 Supabase 服务端客户端（使用 Service Role Key 绕过 RLS）。

**文件：** `server/src/utils/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
```

**验收标准：** 导入 `supabase` 后，`supabase.from('users').select('count')` 返回结果而非权限错误。

---

### 步骤 10.3：认证路由

**目标：** 实现注册、登录、获取当前用户三个端点（BACKEND_STRUCTURE §3 + §4）。

**文件：** `server/src/routes/auth.ts`

**端点：**

`POST /api/auth/register`
- Body: `{ email?, phone?, password, displayName? }`
- 调用 Supabase Auth `signUp`
- 同步创建 `users` 表记录（复制 `auth.users.id`）
- 返回：`{ token: string, user: { id, displayName, currentLevel, townState } }`

`POST /api/auth/login`
- Body: `{ email?, phone?, password }`
- 调用 Supabase Auth `signInWithPassword`
- 返回：`{ token: string, user: { id, displayName, currentLevel, townState } }`

`GET /api/user/me`
- Header: `Authorization: Bearer <token>`
- 验证 token → 查询 `users` 表
- 返回：`{ id, displayName, currentLevel, townState, apiKeyHash }`

`PUT /api/user/api-key-hash`
- Header: `Authorization: Bearer <token>`
- Body: `{ apiKeyHash: string }` (SHA-256 hex)
- 更新 `users.api_key_hash`

**中间件：** 创建 `server/src/utils/authMiddleware.ts`，验证 `Authorization: Bearer <token>` header，将 `userId` 附加到 `req` 对象。

**验收标准：** `POST /api/auth/register` 成功注册后，`users` 表中有对应记录；`GET /api/user/me` 使用返回的 token 能获取用户信息。

---

## Phase 11 — 后端：AI 服务层

### 步骤 11.1：AI 模型配置文件

**目标：** 创建统一的模型配置，便于在 Hackathon（Claude）和产品化（千问）之间切换。

**文件：** `server/src/utils/modelConfig.ts`（TECH_STACK §6.1）
```typescript
export const MODEL_CONFIG = {
  model: 'claude-sonnet-4-6',  // Anthropic 官方 API ID，与 TECH_STACK 一致
  apiEndpoint: 'https://new.codeforvibe.com/v1/messages',
  keyPrefix: 'sk-',
} as const
```

**验收标准：** 文件存在，导入无错误。

---

### 步骤 11.2：MetaPlanner 服务

**目标：** 实现「制定工作计划」功能——将设计桌输入整理成结构化 `ProjectSpec`。

**文件：** `server/src/services/MetaPlanner.ts`

**职责（PRD §3.2 + BACKEND_STRUCTURE §7）：**
- 接收前端传来的原始 `ProjectSpec`（含用户填写的卡片内容）
- 按卡槽从上到下顺序对卡片进行排序和规范化
- 若委托单中项目名称不明确，从 `brief` 字段截取前 20 字符作为 `name`
- 返回结构化、排序后的 `ProjectSpec`（不调用 Claude，纯逻辑处理）

**对应路由（`POST /api/meta-plan`）：** 位于 `server/src/routes/projects.ts` 中。

**请求头要求：** 前端调用此接口时，必须从 `sessionStorage.getItem('ct_api_key')` 获取 API Key 并通过 `X-API-Key` header 传递给后端。后端仅从请求头读取 Key，**不存储**，处理完即销毁。

**验收标准：** 传入乱序的 `ProjectSpec`，返回按顺序排列的 `ProjectSpec`，委托单在第一位。无 `X-API-Key` header 时返回 401。

---

### 步骤 11.3：SkillInjector 服务

**目标：** 组装每个 Agent 的完整 System Prompt（TECH_STACK §6.3 层叠结构）。

**文件：** `server/src/services/SkillInjector.ts`

**Prompt 层叠顺序（严格按照 TECH_STACK §6.3）：**
```
[role]                     → Agent 身份描述
[project_based_prompt]     → 用户在工匠卡填写的项目级描述（L3+）
[rules_always]             → 始终激活的规则 content（L2+）
[skills]                   → 匹配该 Agent target_agent 的技能包 content（L3+）
[library]                  → 图书馆文档（L4，≤8000 tokens）
[flow_control_constraints] → 流程控制指令（L3+）
[task]                     → 当前具体任务描述

> 注：以上顺序严格按照 BACKEND_STRUCTURE §7.3 定义，不可调换。`[rules_always]` 必须在 `[skills]` 之前注入。
```

**各 Agent 的 `[role]` 基础 Prompt：**
- Planner（小策）：「你是一个专业的项目规划者...」
- Builder（小匠）：「你是一个专业的前端开发者...只输出完整可运行的 HTML 代码...」
- Tester（小检）：「你是一个测试工程师...」
- Reviewer（小审）：「你是一个代码审查者...」

**验收标准：** `buildSystemPrompt('builder', projectSpec, 'task-1')` 返回包含正确层叠内容的字符串。

---

### 步骤 11.4：AgentRunner 服务（流式 Claude 调用）

**目标：** 封装单次 Claude API 流式调用，逐 chunk 推送到 WebSocket。

**文件：** `server/src/services/AgentRunner.ts`

**核心逻辑：**
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { MODEL_CONFIG } from '../utils/modelConfig'

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onMirrorChunk: (chunk: string, isComplete: boolean) => void
): Promise<string> {
  const client = new Anthropic({
    apiKey,
    baseURL: MODEL_CONFIG.apiEndpoint,
  })

  let fullContent = ''

  const stream = client.messages.stream({
    model: MODEL_CONFIG.model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text
      fullContent += text
      onChunk(text)          // → agent_chunk WebSocket 事件
      onMirrorChunk(text, false) // → mirror_chunk WebSocket 事件
    }
  }

  onMirrorChunk('', true)  // isComplete: true
  return fullContent
}
```

**安全要求：**
- `apiKey` 参数**不写入日志**（不用 `console.log(apiKey)` 或类似操作）
- 调用失败时抛出 Error，由 Orchestrator 捕获

**验收标准：** 调用 `runAgent` 后，`onChunk` 回调被多次调用（每次一个 token chunk），最终返回完整内容字符串。

---

### 步骤 11.5：Orchestrator 服务（Task DAG 执行引擎）

**目标：** 实现整个构建流程的协调者——执行 Task DAG、处理顺序/并行/迭代/审批节点。

**文件：** `server/src/services/Orchestrator.ts`

**执行流程（PRD §2.4 + §2.7）：**

1. **Planner 阶段：**
   - 用 `SkillInjector` 组装 Planner 的 system prompt
   - 调用 `AgentRunner.runAgent()`
   - 解析输出为 `TaskDAG`（JSON 格式）
   - 通过 WebSocket 发送 `plan_complete` 消息

2. **Task 执行阶段：**
   - 按 `FlowInstruction` 约束调度任务（顺序/并行/迭代）
   - 每个任务开始前发送 `task_started` 消息
   - 执行对应 Agent（Builder/Tester/Reviewer）
   - 任务完成后发送 `task_done` 消息
   - 若遇到「让我看看」节点，发送 `checkpoint` 消息，等待前端 `checkpoint_response`

3. **完成阶段：**
   - 收集 Builder 输出的 HTML
   - 生成 8 位 `shareSlug`（使用 `crypto.randomBytes(4).toString('hex')`）
   - 更新 `projects` 表：`status='completed'`，`output_html`，`share_slug`
   - 发送 `build_complete` 消息

4. **iframe CSP 注入（TECH_STACK §10.3）：**
   - 在 `build_complete` 前，对 `outputHtml` 注入 CSP meta 标签（防止 iframe 内网络请求）

**验收标准：** 完整执行一个 L1 构建流程，最终收到 `build_complete` 消息且 `outputHtml` 为有效 HTML 字符串。

---

### 步骤 11.6：MirrorService

**目标：** 管理 Mirror 面板的气泡生命周期，避免多 Agent 并发时内容混乱。

**文件：** `server/src/services/MirrorService.ts`

**职责：**
- 为每个 Agent 维护独立的气泡流
- `startBubble(agentId, agentType)` → 前端创建新气泡
- `appendChunk(agentId, chunk)` → 前端更新当前气泡内容
- `completeBubble(agentId)` → 前端标记气泡完成

**MirrorService 直接通过 `onMirrorChunk` 回调与 AgentRunner 通信**，不独立持有 WebSocket 引用。

**验收标准：** 两个 Agent 并行执行时，Mirror 中显示两个独立气泡，内容不交叉。

---

## Phase 12 — 后端：WebSocket 服务

### 步骤 12.1：WebSocket Handler

**目标：** 实现 WebSocket 消息路由器，处理 `start_build`、`checkpoint_response`、`stop_build` 三类消息。

**文件：** `server/src/ws/wsHandler.ts`

**消息处理逻辑（BACKEND_STRUCTURE §5）：**

```typescript
import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'node:http'
import { Server } from 'node:http'
import { Orchestrator } from '../services/Orchestrator'

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // 1. 从 URL query param 解析 token，验证用户身份
    // 2. 将 ws 实例与 userId 绑定

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString()) as WsClientMessage

      if (msg.type === 'start_build') {
        // 创建 projects 记录（status='building'）
        // 启动 Orchestrator（传入 ws 的 send 函数作为回调）
        const orchestrator = new Orchestrator(ws, userId, msg.projectSpec, msg.apiKey)
        orchestrator.start()
      }

      if (msg.type === 'checkpoint_response') {
        // 通知 Orchestrator 继续执行
      }

      if (msg.type === 'stop_build') {
        // 停止 Orchestrator，更新 project.status='failed'
      }
    })
  })
}
```

**安全要求：**
- WebSocket 连接时必须验证 token（从 query param 获取）
- 未验证的连接必须立即关闭：无 token 时用 `ws.close(4001, 'missing_token')`，token 无效时用 `ws.close(4001, 'invalid_token')`（BACKEND_STRUCTURE §5.1）
- `apiKey` 不写日志

**验收标准：** 前端建立 WebSocket 连接后，发送 `start_build` 消息，后端能收到并开始调用 Claude API。

---

## Phase 13 — 后端：Plug 与魔法连接

### 步骤 13.1：MagicConnector 服务

**目标：** 实现魔法连接分类器和各 API 调用逻辑（TECH_STACK §8.5 完整实现）。

**文件：** `server/src/services/MagicConnector.ts`

直接使用 TECH_STACK §8.5 中的完整代码实现，包含：
- 关键词白名单分类器 `classifyByKeyword()`
- 城市名提取 `extractCity()`
- 目标语言提取 `extractTargetLang()`
- 新闻频道提取 `extractNewsType()`
- 统一入口 `classifyAndCall()`

**三路 API 调用（TECH_STACK §8.2-8.4）：**
- 天气：高德两步（地理编码 → 天气预报）
- 翻译：百度翻译（MD5 签名）
- 新闻：聚合数据（只返回标题，不返回原文）

**验收标准：** `classifyAndCall('上海今天天气')` 成功返回 `{ category: 'weather', data: {...} }`。

---

### 步骤 13.2：PlugProxy 路由

**目标：** 创建 Plug 代理路由，前端通过后端代理调用外部 API（平台 Key 不暴露到前端）。

**文件：** `server/src/routes/plug.ts`

**端点：**

`POST /api/plug/unsplash`
- Body: `{ keyword: string }`
- 调用 `https://api.unsplash.com/search/photos?query={keyword}&per_page=5`
- Header: `Authorization: Client-ID {UNSPLASH_ACCESS_KEY}`
- 返回：`{ urls: string[] }`（5 张图片的 regular URL）

`POST /api/plug/mapbox`
- Body: `{ location: string }`
- Step 1: Geocoding API 获取经纬度
- Step 2: 拼接静态地图图片 URL
- 返回：`{ imageUrl: string, lat: number, lon: number }`

`POST /api/plug/magic`
- Body: `{ description: string }`
- 调用 `MagicConnector.classifyAndCall(description)`
- 返回：`MagicResult`

**验收标准：** `POST /api/plug/unsplash` 传入 `{ keyword: "面包" }` 返回 5 个 Unsplash 图片 URL。

---

### 步骤 13.3：LibraryExtractor 服务 + 图书馆路由

**目标：** 实现图书馆文件上传与文本提取（PRD §2.9 + BACKEND_STRUCTURE §6）。

**文件：** `server/src/services/LibraryExtractor.ts`

**文本提取逻辑（TECH_STACK §4.4）：**
```typescript
export async function extractText(
  filePath: string,
  originalName: string
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase()

  if (ext === '.txt' || ext === '.md') {
    return fs.promises.readFile(filePath, 'utf-8')
  }

  if (ext === '.doc' || ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }

  throw new Error(`不支持的文件格式：${ext}`)
}
```

**文件：** `server/src/routes/library.ts`

`POST /api/library/upload`
- 使用 `multer` 中间件，`limits.fileSize: 500 * 1024`（500KB）
- `accept: .txt,.md,.doc,.docx`（MIME 类型校验）
- 调用 `LibraryExtractor.extractText()`
- 上传文件到 Supabase Storage，路径格式严格为：`library-uploads/{userId}/{level}/{uuid}_{originalFilename}`（其中 `uuid` 用 `crypto.randomUUID()` 生成，`level` 固定为 `4`）（BACKEND_STRUCTURE §6.2）
- 返回：`{ content: string, fileName: string, charCount: number }`

**验收标准：** 上传一个 `.docx` 文件，返回提取的纯文本字符串；上传 PDF 返回 400 错误。

---

## Phase 14 — 后端：其余 REST API 路由

### 步骤 14.1：项目路由

**文件：** `server/src/routes/projects.ts`（在 MetaPlanner 步骤基础上扩展）

**端点：**

`POST /api/meta-plan`
- 认证：需要 token
- 请求头：`X-API-Key: {claude_api_key}`（必填，不存储，处理完即销毁）
- Body: `ProjectSpec`
- 调用 `MetaPlanner.organize(spec)` 返回排序后的 `ProjectSpec`

`GET /api/projects`
- 认证：需要 token
- 返回当前用户的所有项目（`{ id, name, level, status, shareSlug, completedAt }`[]）

`GET /api/projects/:id`
- 认证：需要 token（且 `project.user_id === userId`）
- 返回完整项目记录

`GET /api/p/:slug`（公开，无需认证）
- 通过 `shareSlug` 查询项目
- 返回：`{ outputHtml: string, projectName: string, authorName: string }`

**验收标准：** `GET /api/projects` 使用有效 token 返回当前用户的项目列表；无 token 返回 401。

---

### 步骤 14.1b：小镇公开页路由

**文件：** `server/src/routes/users.ts`

**端点：**

`GET /api/town/:username`（公开，无需认证）
- 通过 `display_name` 查询用户的小镇地图状态，用于分享小镇页面（APP_FLOW §8.x）
- 返回：`{ displayName: string, townState: TownState }`
- 若用户不存在，返回 404

**在 `server/src/index.ts` 中注册路由：**
```typescript
import usersRouter from './routes/users'
// ...
app.use('/api/town', usersRouter)
```

**验收标准：** `GET /api/town/{username}` 返回对应用户的 `townState`；用户不存在时返回 404。

---

### 步骤 14.2：草稿路由

**文件：** `server/src/routes/drafts.ts`

**端点：**

`GET /api/drafts/:level`
- 返回该用户该关卡的草稿（若无则返回 `null`）

`PUT /api/drafts/:level`
- Body: 部分 `ProjectSpec`（允许不完整）
- Upsert 草稿（BACKEND_STRUCTURE §1.3 UNIQUE 约束）

`DELETE /api/drafts/:level`
- 构建成功后由 Orchestrator 调用，删除该关卡草稿

**前端自动保存逻辑：** 设计桌每次卡片变动后，前端 `debounce(2000ms)` 调用 `PUT /api/drafts/:level`。

**验收标准：** 填写设计桌后等待 2 秒，数据库中出现对应草稿记录。

---

### 步骤 14.3：技能包与规则路由

**文件：** `server/src/routes/skills.ts`

**端点：**

`GET /api/skills`
- 返回内置技能包（`is_builtin=true`）+ 当前用户自定义技能包

`POST /api/skills`
- 创建用户自定义技能包

**文件：** `server/src/routes/rules.ts`（相同模式，对应 `rules` 表）

**验收标准：** `GET /api/skills` 返回至少 5 条内置技能包。

---

## Phase 15 — 集成联调与部署

### 步骤 15.1：前后端联调验证

**目标：** 端对端验证完整的 L1 构建流程。

**验收标准清单：**
- [ ] 注册新账号 → 登录 → 进入小镇地图
- [ ] 点击 L1 面包店建筑 → 进入设计桌
- [ ] 拖入委托单、装修方案、需求清单三张卡片
- [ ] 点击「制定工作计划」→ Meta Planner 运行 → 卡片重新排序
- [ ] 输入 Claude API Key → 点击「开始建造」
- [ ] WebSocket 连接建立，收到 `plan_complete` 消息，工地出现工位
- [ ] Planner 工位开始运转（float 动画）
- [ ] Mirror 面板出现流式气泡
- [ ] Builder 工位完成，收到 `build_complete`
- [ ] 揭幕按钮出现，点击后 confetti 播放，iframe 正确显示 HTML
- [ ] 分享链接可复制，访问 `/p/{slug}` 页面显示项目

---

### 步骤 15.2：前端部署（Vercel）

**目标：** 配置 Vercel 部署。

**操作清单：**
1. 在根目录创建 `vercel.json`（TECH_STACK §12.1）
2. 在 Vercel 控制台设置：
   - Build Command: `npm run build -w client`
   - Output Directory: `client/dist`
   - Node.js Version: `22.x`
3. 添加环境变量：`VITE_API_BASE_URL`（Railway 后端域名）、`VITE_WS_URL`（`wss://...`）

**`vercel.json` 内容：**
```json
{
  "buildCommand": "npm run build -w client",
  "outputDirectory": "client/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**验收标准：** Vercel 构建成功，访问部署域名显示登录页面。

---

### 步骤 15.3：后端部署（Railway）

**目标：** 配置 Railway 部署，包含环境变量和健康检查。

**操作清单：**
1. 在 Railway 新建服务，连接 GitHub 仓库
2. 设置：
   - Build Command: `npm run build -w server`
   - Start Command: `node server/dist/index.js`
   - Health Check: `GET /health`
3. 在 Railway 变量设置中添加 `.env.example` 中的所有变量（填入实际值）
4. 将 `CORS_ORIGIN` 设置为 Vercel 前端域名

**验收标准：** Railway 部署成功，`https://{railway-domain}/health` 返回 `{"status":"ok"}`；前端能成功连接后端 API 和 WebSocket。

---

## 附录 A：组件开发优先级

下表为各 Phase 内的建议优先级（若时间有限，按此顺序削减范围）：

| 优先级 | 功能 | 对应步骤 |
|--------|------|---------|
| P0（必须） | 登录注册 + BYOK + L1 完整流程 | 5, 7.1-7.4.3, 7.5, 7.6, 8, 9, 10, 11 |
| P1（重要） | 小镇地图 + L2 工匠团队配置 | 6, 7.4.4 |
| P2（标准） | L3 技能包/规则/流程控制/Plug | 7.4.5-7.4.8, 13 |
| P3（完整） | L4 图书馆/魔法连接 + 部署 | 7.4.9, 13.3, 15 |

---

## 附录 B：关键约束备忘

| 约束 | 来源 | 说明 |
|------|------|------|
| 所有 npm 版本精确锁定 | TECH_STACK §2 | 禁止 `^`、`~`、`latest` |
| 前端不直连 Supabase | BACKEND_STRUCTURE §1 | 所有数据操作走后端 API |
| API Key 不写日志、不存原文 | TECH_STACK §6.1 | 仅存 SHA-256 hash |
| Tailwind v4 无 postcss.config.js | TECH_STACK §3.2 | 用 Vite 插件替代 |
| 全 UI 文案中文 | FRONTEND_GUIDELINES §1.2 | 无英文按钮/标签 |
| 无描边、无阴影（除 hover） | FRONTEND_GUIDELINES §1.2 | 扁平化铁律 |
| 仅桌面端（1280px+） | PRD §1.4 | 不支持移动端，`min-width: 1280px` |
| 无游客模式 | PRD §1.6 | 进入小镇必须登录 |
| PDF 不支持 | PRD §1.6 + TECH_STACK §4.4 | 图书馆仅 txt/md/doc/docx |
| iframe sandbox | TECH_STACK §10.3 | `allow-scripts allow-same-origin` |
