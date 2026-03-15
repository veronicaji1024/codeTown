# CodeTown — TECH_STACK v1.0

> **锁版原则：** 所有版本号精确锁定，禁止使用 `^`、`~`、`*` 范围符号。
> 根目录 `.npmrc` 必须包含 `save-exact=true`，确保任何后续 `npm install <pkg>` 也精确锁定。
> `package-lock.json` 必须提交到 Git，作为构建的唯一真相来源。

**文档版本：** 1.0 | **对应 PRD：** v6.5 | **日期：** 2026-03-13

---

## 目录

1. [工程结构](#1-工程结构)
2. [运行时 & 包管理](#2-运行时--包管理)
3. [前端 client/](#3-前端-client)
4. [后端 server/](#4-后端-server)
5. [共享类型 shared/](#5-共享类型-shared)
6. [AI 模型配置](#6-ai-模型配置)
7. [外部服务 & API](#7-外部服务--api)
8. [魔法连接白名单配置](#8-魔法连接白名单配置)
9. [环境变量完整清单](#9-环境变量完整清单)
10. [编译 & 构建配置](#10-编译--构建配置)
11. [代码规范工具](#11-代码规范工具)
12. [部署目标](#12-部署目标)

---

## 1. 工程结构

```
codetown/                          # monorepo 根目录
├── .npmrc                         # save-exact=true
├── .nvmrc                         # 22.14.0
├── .env.example                   # 环境变量模板（提交）
├── .env                           # 实际密钥（不提交，.gitignore）
├── package.json                   # workspace 根，private: true
├── package-lock.json              # 提交，唯一版本真相来源
├── client/                        # React 19 SPA（前端）
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   │   ├── fonts/                 # OPPOSans-*.woff2（不经 Vite 处理）
│   │   └── audio/                 # bgm.mp3, click.mp3, snap.mp3
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── assets/
│       │   └── icons/             # Phosphor 预下载 SVG（备用）
│       ├── components/
│       │   ├── ui/                # shadcn/ui 生成组件（不手写）
│       │   ├── map/               # 小镇地图
│       │   ├── workspace/         # 设计桌
│       │   ├── construction/      # 工地
│       │   └── shared/            # NPC、BYOK Modal 等
│       ├── hooks/
│       ├── lib/
│       │   └── utils.ts           # shadcn cn() helper
│       ├── services/
│       │   └── websocket.ts       # WebSocket 客户端
│       ├── store/
│       └── types/                 # 从 shared/ 重新导出
├── server/                        # Express 5 后端
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # 入口
│       ├── routes/
│       ├── services/
│       │   ├── MetaPlanner.ts
│       │   ├── Orchestrator.ts
│       │   ├── AgentRunner.ts
│       │   ├── MirrorService.ts
│       │   ├── PlugProxy.ts
│       │   ├── MagicConnector.ts  # 魔法连接分类器
│       │   ├── LibraryExtractor.ts
│       │   └── SkillInjector.ts
│       ├── ws/
│       │   └── wsHandler.ts       # WebSocket 消息路由
│       └── utils/
└── shared/                        # 前后端共享 TypeScript 类型
    ├── package.json
    └── src/
        ├── types.ts               # ProjectSpec, AgentType, WsMessage…
        └── index.ts
```

**工作区声明（根 `package.json`）：**

```json
{
  "name": "codetown",
  "version": "0.0.0",
  "private": true,
  "workspaces": ["client", "server", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w client\" \"npm run dev -w server\"",
    "build": "npm run build -w shared && npm run build -w client && npm run build -w server",
    "lint": "npm run lint -w client && npm run lint -w server"
  },
  "devDependencies": {
    "concurrently": "9.1.2"
  }
}
```

---

## 2. 运行时 & 包管理

| 工具 | 精确版本 | 说明 |
|------|----------|------|
| **Node.js** | `22.14.0` LTS | LTS 代号 "Jod"；`.nvmrc` 固定 |
| **npm** | `10.9.2` | Node 22.14.0 捆绑；不升级 |
| **TypeScript** | `5.7.3` | 前端 & 后端共同使用；不跨包混版本 |

**`.nvmrc` 内容：**
```
22.14.0
```

**`.npmrc` 内容：**
```
save-exact=true
engine-strict=true
```

**根 `package.json` `engines` 字段：**
```json
{
  "engines": {
    "node": "22.14.0",
    "npm": "10.9.2"
  }
}
```

---

## 3. 前端 `client/`

### 3.1 核心框架

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `react` | `19.0.0` | UI 框架 |
| `react-dom` | `19.0.0` | DOM 渲染器 |
| `typescript` | `5.7.3` | 类型系统 |
| `vite` | `6.1.0` | 构建工具 & 开发服务器 |
| `@vitejs/plugin-react` | `4.3.4` | React Fast Refresh + JSX Transform |
| `wouter` | `3.3.5` | 轻量级前端路由（用于处理分享链接） |

> React 19 使用新的 JSX Transform，无需在每个文件顶部 `import React`。
> `@vitejs/plugin-react` 4.3.4 是对应 React 19 + Vite 6 的最低兼容版本。
> 引入 `wouter` 是为了支持 `/p/{slug}` 等分享链接的路由解析，它比 `react-router-dom` 更轻量，符合本项目不使用重型路由库的原则。

### 3.2 Tailwind CSS v4

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `tailwindcss` | `4.0.6` | 原子 CSS 框架（v4 架构，CSS-first 配置） |
| `@tailwindcss/vite` | `4.0.6` | Tailwind v4 的 Vite 专用插件，替代 PostCSS |

> **重要：** Tailwind v4 不再需要 `tailwind.config.js` 或 `postcss.config.js`。
> 所有配置写在 `src/index.css` 的 `@theme {}` 块中。
> 不安装 `autoprefixer`（v4 内置）。不安装 `postcss`（v4 在 Vite 插件中处理）。

**`vite.config.ts` 示例：**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001', '/ws': { target: 'ws://localhost:3001', ws: true } } }
})
```

**`src/index.css` 主题配置（节选）：**
```css
@import "tailwindcss";

@theme {
  --color-brand-blue: #3385FF;
  --color-brand-teal: #29665B;
  --color-brand-coral: #E5594F;
  --color-bg-base: #F8F2E2;

  --font-family-base: 'OPPO Sans', system-ui, sans-serif;
}

@font-face {
  font-family: 'OPPO Sans';
  src: url('/fonts/OPPOSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
/* 同理添加 Medium(500)、Bold(700) */
```

### 3.3 shadcn/ui 组件系统

shadcn/ui 是代码复制工具，不是 npm 包。通过 CLI 生成组件代码后，以下是其**运行时依赖**（必须精确安装）：

**Radix UI 原语（按需安装，仅列出 CodeTown 用到的组件）：**

| 包 | 精确版本 | 对应 shadcn 组件 |
|----|----------|-----------------|
| `@radix-ui/react-slot` | `1.1.1` | Button（asChild 模式） |
| `@radix-ui/react-dialog` | `1.1.4` | Modal（BYOK 拦截、错误提示） |
| `@radix-ui/react-tabs` | `1.1.2` | 设计桌 / 工地 Tab 切换 |
| `@radix-ui/react-toast` | `1.2.4` | 系统 Toast（资料过大、文件错误等） |
| `@radix-ui/react-scroll-area` | `1.2.2` | 文件夹列表、Mirror 气泡区滚动 |
| `@radix-ui/react-tooltip` | `1.1.6` | 工位卡片 hover 提示 |
| `@radix-ui/react-label` | `2.1.1` | 表单标签 |
| `@radix-ui/react-separator` | `1.1.1` | 分隔线 |
| `@radix-ui/react-progress` | `1.1.1` | Token 面板进度条、构建进度 |

**shadcn/ui 工具库：**

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `class-variance-authority` | `0.7.1` | 组件变体管理（Button、Badge 等） |
| `clsx` | `2.1.1` | 条件 class 拼接 |
| `tailwind-merge` | `3.0.1` | 合并 Tailwind class，避免冲突；支持 v4 |
| `lucide-react` | `0.469.0` | shadcn/ui 内部图标（仅供生成的组件使用） |

> **注意：** CodeTown 自定义组件使用 Phosphor Icons（见 3.5），不使用 lucide-react。
> `lucide-react` 仅作为 shadcn/ui 内部生成代码的依赖保留，不在业务代码中 import。

**shadcn CLI（仅开发期使用，不进 package.json）：**
```bash
npx shadcn@2.3.0 init
npx shadcn@2.3.0 add button dialog tabs toast scroll-area tooltip label separator progress
```

### 3.4 拖放系统

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `@dnd-kit/core` | `6.3.1` | 核心拖放引擎（文件夹卡片 → 图纸卡槽） |
| `@dnd-kit/sortable` | `8.0.0` | 可排序列表（不直接用，但提供 SortableContext） |
| `@dnd-kit/utilities` | `3.2.2` | CSS Transform 工具函数 |

> 使用 `DndContext` + 自定义 `DragOverlay`，实现卡片磁吸入槽效果。
> 不安装 `@dnd-kit/modifiers`（CodeTown 不需要拖放约束修饰符）。

### 3.5 图标库

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `@phosphor-icons/react` | `2.1.7` | 全局图标系统（Regular 和 Bold 权重） |

> 图标已预下载至 `/icons/regular/`（60个）和 `/icons/bold/`（21个），见 FRONTEND_GUIDELINES.md。
> 使用方式：`import { House, Wrench } from '@phosphor-icons/react'`。
> 不安装 `@phosphor-icons/core`（React 包已内置 SVG 数据）。

### 3.6 动效 & 音效

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `canvas-confetti` | `1.9.3` | 揭幕时刻 confetti 动画 |

> CSS 动画（工匠等待浮动、工作脉冲、完成弹跳、失败摇晃）均用纯 CSS 实现，不引入额外动画库。
> 音效用原生 `new Audio('/audio/click.mp3').play()` 实现，不引入 Howler.js。
> BGM 用 `<audio loop src="/audio/bgm.mp3">` HTML 标签，不引入额外包。

### 3.7 前端 TypeScript 类型声明（devDependencies）

| 包 | 精确版本 |
|----|----------|
| `@types/react` | `19.0.8` |
| `@types/react-dom` | `19.0.3` |
| `@types/canvas-confetti` | `1.6.4` |

### 3.8 `client/package.json` 完整清单

```json
{
  "name": "@codetown/client",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.app.json && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@dnd-kit/core": "6.3.1",
    "@dnd-kit/sortable": "8.0.0",
    "@dnd-kit/utilities": "3.2.2",
    "@phosphor-icons/react": "2.1.7",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-tabs": "1.1.2",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-tooltip": "1.1.6",
    "canvas-confetti": "1.9.3",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "0.469.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwind-merge": "3.0.1",
    "wouter": "3.3.5"
  },
  "devDependencies": {
    "@eslint/js": "9.19.0",
    "@tailwindcss/vite": "4.0.6",
    "@types/canvas-confetti": "1.6.4",
    "@types/react": "19.0.8",
    "@types/react-dom": "19.0.3",
    "@vitejs/plugin-react": "4.3.4",
    "eslint": "9.19.0",
    "eslint-plugin-react-hooks": "5.1.0",
    "eslint-plugin-react-refresh": "0.4.18",
    "tailwindcss": "4.0.6",
    "typescript": "5.7.3",
    "typescript-eslint": "8.23.0",
    "vite": "6.1.0"
  }
}
```

### 3.9 `client/tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@codetown/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

---

## 4. 后端 `server/`

### 4.1 HTTP & WebSocket 服务

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `express` | `5.0.1` | HTTP 框架（Express 5，原生支持 async/await 错误处理） |
| `ws` | `8.18.0` | WebSocket 服务器（plan_complete / agent_chunk / mirror_bubble 等） |
| `cors` | `2.8.5` | CORS 中间件（仅允许 `CORS_ORIGIN` 环境变量指定的来源） |
| `dotenv` | `16.4.7` | 环境变量加载（`dotenv/config` 在入口最顶部 import） |

### 4.2 AI SDK

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `@anthropic-ai/sdk` | `0.37.0` | Claude API 调用；支持 streaming response |

> 所有 Agent 调用（Planner、Builder、Tester、Reviewer）均通过此 SDK。
> 用户 BYOK 的 API Key 通过 `X-API-Key` 请求头传入后端，后端在单次请求中使用，**不写入日志，不存库**。
> 存库的仅为 SHA-256 哈希（用 Node.js 内置 `crypto.createHash('sha256')` 计算，无需额外包）。

### 4.3 数据库

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `@supabase/supabase-js` | `2.48.1` | Supabase 客户端（Auth + PostgreSQL + Storage） |

> 使用 `SUPABASE_SERVICE_ROLE_KEY` 初始化服务端客户端（绕过 RLS，仅在后端使用）。
> 前端不直接访问 Supabase（所有数据操作走后端 API）。

### 4.4 文件处理（图书馆 Library 功能）

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `multer` | `1.4.5-lts.1` | 文件上传中间件（支持 .txt / .md / .doc / .docx，单文件 ≤ 500KB） |
| `mammoth` | `1.8.0` | `.doc` / `.docx` → 纯文本提取（不保留格式） |

> `.txt` 和 `.md` 文件用 Node.js 内置 `fs.promises.readFile(path, 'utf-8')` 读取，无需额外包。
> PDF 不支持（PRD § 8.2 明确排除）。
> 单文件大小限制在 `multer` 的 `limits.fileSize` 配置：`500 * 1024`（500KB）。

### 4.5 外部 API 调用（Plug 代理 & 魔法连接）

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js 内置 `fetch` | Node 22 原生 | 调用 高德/百度翻译/聚合数据/Unsplash/Mapbox REST API |
| Node.js 内置 `crypto` | Node 22 原生 | MD5（百度翻译签名）/ SHA-256（BYOK 哈希） |

> Node.js 22 的 `fetch` 已稳定（Undici）。**不安装 `node-fetch` 或 `axios`。**
> 百度翻译签名需要 MD5：`crypto.createHash('md5').update(str).digest('hex')`。

### 4.6 TypeScript 开发工具（devDependencies）

| 包 | 精确版本 | 用途 |
|----|----------|------|
| `typescript` | `5.7.3` | 类型编译 |
| `tsx` | `4.19.2` | 开发模式 TS 执行（替代 ts-node，启动速度更快） |
| `tsup` | `8.3.5` | 生产构建（打包 server/ 为 CommonJS dist） |
| `@types/express` | `5.0.0` | Express 5 类型声明 |
| `@types/ws` | `8.5.13` | WebSocket 类型声明 |
| `@types/cors` | `2.8.17` | cors 包类型声明 |
| `@types/multer` | `1.4.12` | multer 类型声明 |
| `@types/node` | `22.13.5` | Node.js 22 类型声明 |

### 4.7 `server/package.json` 完整清单

```json
{
  "name": "@codetown/server",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs --dts --out-dir dist",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "0.37.0",
    "@supabase/supabase-js": "2.48.1",
    "cors": "2.8.5",
    "dotenv": "16.4.7",
    "express": "5.0.1",
    "mammoth": "1.8.0",
    "multer": "1.4.5-lts.1",
    "ws": "8.18.0"
  },
  "devDependencies": {
    "@types/cors": "2.8.17",
    "@types/express": "5.0.0",
    "@types/multer": "1.4.12",
    "@types/node": "22.13.5",
    "@types/ws": "8.5.13",
    "tsup": "8.3.5",
    "tsx": "4.19.2",
    "typescript": "5.7.3"
  }
}
```

### 4.8 `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@codetown/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

---

## 5. 共享类型 `shared/`

### 5.1 说明

`shared/` 是纯 TypeScript 类型包，无运行时代码，零 npm 依赖。前端和后端均通过 workspace 路径引用。

### 5.2 `shared/package.json`

```json
{
  "name": "@codetown/shared",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "devDependencies": {
    "typescript": "5.7.3"
  }
}
```

### 5.3 核心类型（`shared/src/types.ts`，节选结构）

```typescript
// ===== WebSocket 消息类型（PRD §9.9）=====
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

export type WsClientMessage =
  | { type: 'start_build'; projectSpec: ProjectSpec; apiKey: string }
  | { type: 'checkpoint_response'; taskId: string; action: 'approve' | 'modify'; note?: string }
  | { type: 'stop_build' };

// ===== 项目规格（设计桌输出）=====
export interface ProjectSpec {
  level: 1 | 2 | 3 | 4;
  brief: {
    text: string;                   // 自由文本，如"面包店新品展示页"
    project_type: 'website' | 'tool' | 'game' | 'app';
  };
  style: {
    visual_preset: string | null;   // 预设风格 ID，如 'warm_sketch'；自定义时为 null
    visual_description: string;     // 视觉描述
    personality: string;            // 性格描述，影响 AI 语气
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
  id: string;                       // 客户端生成的临时 ID（如 'req_1'）
  type: 'feature' | 'constraint' | 'when_then' | 'data';
  text: string;
  when?: string;                    // when_then 类型时使用
  then?: string;
}

export interface TeamConfig {
  agents: AgentConfig[];
}

export interface AgentConfig {
  type: 'planner' | 'builder' | 'tester' | 'reviewer';
  enabled: boolean;
  project_based_prompt: string;     // 用户填写的项目级 prompt，空字符串表示未填写
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

// ===== Agent 类型 =====
export type AgentType = 'planner' | 'builder_structure' | 'builder_style'
  | 'builder_logic' | 'builder_skill' | 'tester' | 'reviewer';

export type MagicCategory = 'weather' | 'translate' | 'news' | 'unsupported';

// 流程控制
export type FlowInstruction = {
  id: string;
  instruction_type: 'sequence' | 'parallel' | 'iterate' | 'checkpoint';
  task_refs: string[];              // 引用需求清单中的 requirement.id
};

// Plug（外部 API 连接）
export type Plug =
  | { id: string; plug_type: 'unsplash'; config: { keyword: string } }
  | { id: string; plug_type: 'mapbox'; config: { location: string } }
  | { id: string; plug_type: 'magic'; config: { description: string; magic_type?: MagicCategory } };

// ===== 其他类型省略，由开发阶段逐步完善 =====
```

---

## 6. AI 模型配置

### 6.1 Hackathon 阶段（当前）

| 配置项 | 值 |
|--------|-----|
| **SDK** | `@anthropic-ai/sdk` `0.37.0` |
| **默认模型** | `claude-sonnet-4-6` |
| **高质量模型** | `claude-opus-4-6` |
| **API Endpoint** | `https://new.codeforvibe.com/v1/messages` |
| **Key 格式** | `sk-…`（Opencode BYOK 代理格式） |
| **Key 来源** | 用户 BYOK（不经平台持有） |
| **Key 存储** | React state + `sessionStorage`（关标签即清除） |
| **Key 传输** | 请求头 `X-API-Key`（HTTPS 加密） |
| **Key 持久化** | 仅存 SHA-256 哈希到 Supabase `users.api_key_hash` |
| **流式输出** | `stream: true`，WebSocket 逐 chunk 推送到 Mirror |


**模型配置封装（`server/src/utils/modelConfig.ts`）：**
```typescript
export const MODEL_CONFIG = {
  model: 'claude-sonnet-4-6',
  apiEndpoint: 'https://new.codeforvibe.com/v1/messages',
  keyPrefix: 'sk-',
} as const;
```

### 6.3 Agent Prompt 结构

每个 Agent 的 system prompt 由以下层叠组成（SkillInjector 负责组装）：

```
[role]                    → Agent 身份（Planner / Builder / Tester / Reviewer）
[project_based_prompt]    → 用户在工匠团队卡片填写的 project-based prompt（L3+）
[skills]                  → 匹配该 Agent 的技能包 content（L3+）
[always_active_rules]     → 始终激活的规则 content（L3+）
[reference_documents]     → 图书馆注入内容（L4，≤ 8000 tokens）
[flow_control_constraints]→ 流程控制指令（L3+）
[task]                    → 当前具体任务描述
```

---

## 7. 外部服务 & API

### 7.1 Supabase

| 配置项 | 值 |
|--------|-----|
| **计划** | Free Tier（Hackathon） |
| **PostgreSQL 版本** | 15.x（Supabase 托管） |
| **Auth 方式** | 邮箱/手机号密码（Supabase Auth 内置） |
| **Storage** | 图书馆上传文件临时存储 |
| **SDK 版本** | `@supabase/supabase-js` `2.48.1` |
| **客户端初始化** | 后端：`SUPABASE_SERVICE_ROLE_KEY`；前端：不直连 |

### 7.2 L3 预制 Plug（平台 Key 代理）

| 服务 | 用途 | 认证方式 | 免费额度 | 后端代理路径 |
|------|------|----------|----------|-------------|
| **Unsplash API** | 图片素材搜索 → 返回图片 URL | `Authorization: Client-ID {UNSPLASH_ACCESS_KEY}` | 50 次/小时 | `POST /api/plug/unsplash` |
| **Mapbox API** | 地名 → 坐标 → 静态地图 URL | `?access_token={MAPBOX_ACCESS_TOKEN}` | 50,000 次/月 | `POST /api/plug/mapbox` |

**Unsplash 调用端点：**
```
GET https://api.unsplash.com/search/photos?query={keyword}&per_page=5
```

**Mapbox 调用顺序（两步）：**
```
Step 1 - Geocoding:
GET https://api.mapbox.com/search/geocode/v6/forward?q={location}&access_token={TOKEN}

Step 2 - Static Image URL (无需请求，直接拼接):
https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/
  pin-s+3385ff({lon},{lat})/{lon},{lat},14/600x400@2x?access_token={TOKEN}
```

---

## 8. 魔法连接白名单配置

### 8.1 白名单 API 对比表

| 类别 | 服务商 | 免费额度 | API Endpoint | 认证方式 | 适用 CodeTown 场景 |
|------|--------|----------|--------------|----------|-------------------|
| **🌤 天气** | 高德地图 | 个人 5,000 次/天 | `https://restapi.amap.com/v3/weather/weatherInfo` | Query param `key=` | 用户描述"上海今天天气" |
| **🌐 翻译** | 百度翻译 | 高级版 100万字符/月（个人认证后） | `https://fanyi-api.baidu.com/api/trans/vip/translate` | Query params `appid`, `sign` | 用户描述"把这句话翻译成英文" |
| **📰 新闻** | 聚合数据 | 100 次/天（免费版） | `https://v.juhe.cn/toutiao/index` | Query param `key=` | 用户描述"搜索关于猫的新闻" |

### 8.2 高德天气 API — 详细规格

```
# Step 1：城市名 → adcode（高德地理编码）
GET https://restapi.amap.com/v3/geocode/geo
  ?address={cityName}
  &key={AMAP_KEY}
→ 提取 response.geocodes[0].adcode（6位数字，如"310000"代表上海）

# Step 2：adcode → 天气
GET https://restapi.amap.com/v3/weather/weatherInfo
  ?city={adcode}
  &extensions=all          # base=今日，all=预报（推荐 all 以获取更多信息）
  &key={AMAP_KEY}
→ 返回 response.forecasts[0].casts[]（未来4天预报）
```

**返回字段（`extensions=all` 时）：**
- `date`：日期
- `dayweather` / `nightweather`：天气状况（晴/多云/小雨…）
- `daytemp` / `nighttemp`：温度（摄氏度，字符串）
- `daywind` / `nightwind`：风向
- `daypower` / `nightpower`：风力

**错误码处理：**
- `10000`：成功
- `10001`：KEY 不正确或过期
- `10004`：访问超量（日配额耗尽）

### 8.3 百度翻译 API — 详细规格

```
POST https://fanyi-api.baidu.com/api/trans/vip/translate
Content-Type: application/x-www-form-urlencoded

Body params:
  q={待翻译文本，URL编码}
  from=auto               # 自动检测源语言
  to={目标语言代码}        # en/ja/ko/fr/de/es 等
  appid={BAIDU_TRANSLATE_APPID}
  salt={随机数，如 Date.now()}
  sign={MD5(appid + q + salt + BAIDU_TRANSLATE_SECRET)}
```

**签名计算（Node.js）：**
```typescript
import { createHash } from 'node:crypto';

function buildBaiduSign(q: string, salt: string): string {
  const str = `${process.env.BAIDU_TRANSLATE_APPID}${q}${salt}${process.env.BAIDU_TRANSLATE_SECRET}`;
  return createHash('md5').update(str).digest('hex');
}
```

**支持的目标语言代码（常用）：**
| 语言 | 代码 |
|------|------|
| 英语 | `en` |
| 日语 | `jp` |
| 韩语 | `kor` |
| 法语 | `fra` |
| 德语 | `de` |
| 西班牙语 | `spa` |
| 俄语 | `ru` |
| 中文简体 | `zh` |

**分类器语言提取逻辑：**
- "翻译成英文/英语" → `to: 'en'`
- "翻译成日语/日文" → `to: 'jp'`
- 未指定目标语言 → 默认 `to: 'en'`

### 8.4 聚合数据新闻 API — 详细规格

```
GET https://v.juhe.cn/toutiao/index
  ?type={频道}
  &key={JUHE_NEWS_KEY}
```

**频道类型（`type` 参数）：**
| 频道 | `type` 值 |
|------|-----------|
| 头条（默认） | `top` |
| 国内 | `guonei` |
| 国际 | `guoji` |
| 娱乐 | `yule` |
| 体育 | `tiyu` |
| 军事 | `junshi` |
| 科技 | `keji` |
| 财经 | `caijing` |
| 游戏 | `youxi` |
| 汽车 | `qiche` |
| 健康 | `jiankang` |

> **版权注意：** 聚合数据新闻接口数据不得直接展示给终端用户。Agent 必须基于新闻标题/摘要**重新表述**后再注入到项目中，不直接嵌入原始文本。

**备选方案（当聚合数据版权限制触发时）：**
1. 让 Claude Agent 基于通用知识生成虚构的示例新闻内容（适合 Demo 场景）
2. 接入「今日热榜」聚合接口（`https://tophub.today/n/{id}`，RSS 模式）

### 8.5 魔法连接分类器实现

**文件位置：** `server/src/services/MagicConnector.ts`

```typescript
import { MagicCategory } from '@codetown/shared';

// ===== 关键词白名单（主分类器，无需 Claude 调用）=====
const KEYWORD_MAP: Record<MagicCategory, string[]> = {
  weather: ['天气', '气温', '温度', '下雨', '晴', '阴', '风力', '湿度', '预报', '气候'],
  translate: ['翻译', '翻成', '变成英文', '变成日文', '变成韩文', '转换语言', '用英语说'],
  news: ['新闻', '头条', '资讯', '热点', '最新消息', '报道', '新闻搜索'],
  unsupported: [],
};

// ===== 主分类函数（关键词优先，不消耗 Claude Token）=====
export function classifyByKeyword(description: string): MagicCategory {
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (category === 'unsupported') continue;
    if (keywords.some(kw => description.includes(kw))) {
      return category as MagicCategory;
    }
  }
  return 'unsupported';
}

// ===== 城市名提取（天气用）=====
function extractCity(description: string): string {
  // 简单规则提取：匹配"XX今天/明天/后天的天气"中的 XX
  const match = description.match(/^(.{2,6}?)(?:今天|明天|后天|这周|本周|的天气|天气)/);
  return match?.[1]?.trim() || '北京'; // 默认北京
}

// ===== 目标语言提取（翻译用）=====
function extractTargetLang(description: string): string {
  if (/英文|英语/.test(description)) return 'en';
  if (/日文|日语/.test(description)) return 'jp';
  if (/韩文|韩语/.test(description)) return 'kor';
  if (/法文|法语/.test(description)) return 'fra';
  if (/德文|德语/.test(description)) return 'de';
  return 'en'; // 默认英文
}

// ===== 新闻频道提取 =====
function extractNewsType(description: string): string {
  if (/科技|技术/.test(description)) return 'keji';
  if (/体育|运动|足球|篮球/.test(description)) return 'tiyu';
  if (/财经|经济|股市/.test(description)) return 'caijing';
  if (/娱乐|明星|电影/.test(description)) return 'yule';
  return 'top'; // 默认头条
}

// ===== 统一调用入口 =====
export interface MagicResult {
  category: MagicCategory;
  data: unknown;
  summary?: string; // Agent 用于重新表述的摘要提示
}

export async function classifyAndCall(description: string): Promise<MagicResult> {
  const category = classifyByKeyword(description);

  if (category === 'unsupported') {
    return { category, data: null, summary: '暂时不支持这种连接' };
  }

  if (category === 'weather') {
    const cityName = extractCity(description);
    // Step 1: 城市名 → adcode
    const geoResp = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(cityName)}&key=${process.env.AMAP_KEY}`
    ).then(r => r.json());
    const adcode = geoResp.geocodes?.[0]?.adcode;
    if (!adcode) return { category, data: null, summary: `找不到城市：${cityName}` };
    // Step 2: adcode → 天气
    const weatherResp = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&extensions=all&key=${process.env.AMAP_KEY}`
    ).then(r => r.json());
    return { category, data: weatherResp.forecasts?.[0], summary: `${cityName}天气数据已获取` };
  }

  if (category === 'translate') {
    // 从描述中提取待翻译文本（去掉"翻译"相关词）
    const textToTranslate = description.replace(/翻译[成到]?|用.*语说/g, '').trim() || description;
    const targetLang = extractTargetLang(description);
    const salt = Date.now().toString();
    const { createHash } = await import('node:crypto');
    const sign = createHash('md5')
      .update(`${process.env.BAIDU_TRANSLATE_APPID}${textToTranslate}${salt}${process.env.BAIDU_TRANSLATE_SECRET}`)
      .digest('hex');
    const body = new URLSearchParams({
      q: textToTranslate, from: 'auto', to: targetLang,
      appid: process.env.BAIDU_TRANSLATE_APPID!, salt, sign,
    });
    const transResp = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).then(r => r.json());
    return { category, data: transResp.trans_result?.[0], summary: '翻译结果已获取' };
  }

  if (category === 'news') {
    const newsType = extractNewsType(description);
    const newsResp = await fetch(
      `https://v.juhe.cn/toutiao/index?type=${newsType}&key=${process.env.JUHE_NEWS_KEY}`
    ).then(r => r.json());
    // 仅返回标题和摘要（不返回原文，避免版权问题）
    const headlines = newsResp.result?.data
      ?.slice(0, 10)
      .map((item: { title: string; uniquekey: string }) => ({ title: item.title, id: item.uniquekey }));
    return { category, data: headlines, summary: '新闻头条标题已获取，Agent 需基于标题重新表述内容' };
  }

  return { category: 'unsupported', data: null };
}
```

### 8.6 PlugProxy 路由（`server/src/routes/plug.ts`）

```typescript
// 所有 Plug 请求经由此路由代理，前端无法直接访问外部 API
// 后端持有所有平台 Key，用户 Key 只有 Claude API Key（BYOK）

router.post('/plug/unsplash', async (req, res) => { /* Unsplash 代理 */ });
router.post('/plug/mapbox', async (req, res) => { /* Mapbox 代理 */ });
router.post('/plug/magic', async (req, res) => {
  const { description } = req.body;
  const result = await classifyAndCall(description);
  res.json(result);
});
```

---

## 9. 环境变量完整清单

**文件：** `.env`（不提交）& `.env.example`（提交，值填 `your_xxx_here`）

```dotenv
# ============================================================
# 运行模式
# ============================================================
NODE_ENV=development                      # development | production
PORT=3001
CORS_ORIGIN=http://localhost:5173

# ============================================================
# AI 模型（Hackathon 阶段）
# ============================================================
MODEL_PROVIDER=claude                     # claude | qwen（产品化时切换）
# BYOK：用户运行时通过 X-API-Key 请求头传入，此处不填用户 Key
# 以下为产品化阶段千问平台 Key（Hackathon 阶段留空）
# QWEN_API_KEY=sk-...

# ============================================================
# Supabase
# ============================================================
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# L3 预制 Plug（平台持有，后端代理）
# 申请地址：https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

# 申请地址：https://account.mapbox.com/
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cl91c2VybmFtZSJ9...

# ============================================================
# L4 魔法连接（平台持有，后端代理）
# ------------------------------------------------------------
# 天气 - 高德地图
# 申请地址：https://lbs.amap.com/ → 控制台 → 我的应用 → 添加 Key
# 服务类型选：Web服务
AMAP_KEY=your_amap_key_here

# 翻译 - 百度翻译开放平台
# 申请地址：https://fanyi-api.baidu.com/ → 我的服务 → 通用文本翻译（高级版）
# 需完成个人认证后激活 100万字符/月免费额度
BAIDU_TRANSLATE_APPID=your_baidu_appid_here
BAIDU_TRANSLATE_SECRET=your_baidu_secret_here

# 新闻 - 聚合数据
# 申请地址：https://www.juhe.cn/docs/api/id/235
# 免费版 100次/天，审核通过后即可使用
JUHE_NEWS_KEY=your_juhe_key_here
```

**前端环境变量（`client/.env`，仅 `VITE_` 前缀变量暴露到浏览器）：**

```dotenv
# 后端 API 地址（生产环境替换为实际域名）
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

> **安全原则：** 所有平台 Key（高德、百度、聚合、Unsplash、Mapbox、Supabase）
> 仅存在于 `server/.env`，**绝对不能** 出现在 `VITE_` 前缀变量中。
> 用户的 Claude API Key 通过 `sessionStorage` 在前端保存，通过 `X-API-Key` 请求头
> 传到后端，**不写入 `.env`，不存数据库原文**。

---

## 10. 编译 & 构建配置

### 10.1 前端构建（Vite）

```typescript
// client/vite.config.ts（完整版）
import { defineConfig } from 'vite'           // vite 6.1.0
import react from '@vitejs/plugin-react'      // @vitejs/plugin-react 4.3.4
import tailwindcss from '@tailwindcss/vite'   // @tailwindcss/vite 4.0.6
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          dndkit: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          radix: [
            '@radix-ui/react-dialog', '@radix-ui/react-tabs',
            '@radix-ui/react-toast', '@radix-ui/react-scroll-area',
          ],
        },
      },
    },
  },
})
```

### 10.2 后端构建（tsup）

```typescript
// server/tsup.config.ts
import { defineConfig } from 'tsup'   // tsup 8.3.5

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  dts: false,     // 生产构建不需要类型声明
  sourcemap: false,
})
```

### 10.3 iframe 沙盒配置（PRD §9.8）

生成的 HTML 项目在 iframe 中展示，必须设置：

```typescript
// server/src/services/Orchestrator.ts（揭幕阶段注入）
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin';
const CSP_HEADER = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",         // 允许内联 JS（AI 生成代码）
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://images.unsplash.com https://api.mapbox.com",
  "connect-src 'none'",                  // 不允许 iframe 内网络请求
].join('; ');
```

---

## 11. 代码规范工具

### 11.1 ESLint（`client/`）

| 包 | 精确版本 |
|----|----------|
| `eslint` | `9.19.0` |
| `@eslint/js` | `9.19.0` |
| `typescript-eslint` | `8.23.0` |
| `eslint-plugin-react-hooks` | `5.1.0` |
| `eslint-plugin-react-refresh` | `0.4.18` |

```typescript
// client/eslint.config.ts
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
```

### 11.2 Prettier

```json
// .prettierrc（根目录）
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 12. 部署目标

### 12.1 前端 → Vercel

| 配置项 | 值 |
|--------|-----|
| **平台** | Vercel（Free Hobby） |
| **构建命令** | `npm run build -w client` |
| **输出目录** | `client/dist` |
| **Node.js 版本** | `22.x`（在 Vercel 项目设置中指定） |
| **域名** | `codetown.app`（或 Hackathon 临时域名） |
| **分享路由** | `codetown.app/p/{slug}`（项目）、`codetown.app/u/{name}`（小镇） |

**`vercel.json`（放在根目录）：**
```json
{
  "buildCommand": "npm run build -w client",
  "outputDirectory": "client/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 12.2 后端 → Railway

| 配置项 | 值 |
|--------|-----|
| **平台** | Railway（Hobby Plan，$5/月） |
| **构建命令** | `npm run build -w server` |
| **启动命令** | `node server/dist/index.js` |
| **健康检查** | `GET /health` → `{ status: 'ok' }` |
| **WebSocket 支持** | Railway 原生支持 HTTP Upgrade → WebSocket |
| **备选** | Render（Free Tier，但有冷启动延迟） |

---

## 附录 A：版本冻结原则

1. **安装新包时：** `npm install --save-exact <pkg>@<version> -w <workspace>`
2. **禁止：** `npm install <pkg>@latest`（会随时间漂移）
3. **package-lock.json：** 提交到 Git，CI 使用 `npm ci` 而非 `npm install`
4. **升级依赖：** 必须显式修改 `package.json` 中的版本号，记录到 changelog

## 
