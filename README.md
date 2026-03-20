# CodeTown 🏙️

> **Build Your Town, Learn to Vibe Code**
>
> 用 AI 建造你的虚拟小镇，从零学会 Vibe Coding

---

## ⚠️ Demo 声明

**这是一个早期 Demo，仍在积极开发中。**

- 部分功能尚未完成或存在已知 Bug
- 界面和交互逻辑可能随时变更
- 不建议在生产环境使用
- 完整产品正在搭建中，敬请期待

---

## 产品简介

CodeTown 是一个基于浏览器的闯关游戏。玩家通过引导式 Vibe Coding，在虚拟小镇里盖起一栋栋真实可用的 Web 应用——每栋建筑背后都是一个你亲手造出来的产品。

**目标用户：** 12–18 岁初高中生。用过 ChatGPT，想做酷东西，但从未自己跑过代码。

**核心理念：** 学习永远是创造的副产品，概念在你真正需要的时候才会出现。

### 4 个关卡，9 个核心概念

| 关卡 | 建筑 | 学到的概念 |
|------|------|------------|
| L1 小屋 | 个人主页 | Prompt 工程、需求文档 |
| L2 咖啡馆 | 小工具应用 | Agent 编排、多轮对话 |
| L3 工作室 | 带 API 的应用 | 技能注入、外部服务对接 |
| L4 大楼 | 完整产品 | 多 Agent 协作、项目发布 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| 组件库 | shadcn/ui |
| 状态管理 | Zustand |
| 后端 | Node.js 22 + Express 5 + TypeScript |
| 数据库 | Supabase (PostgreSQL) |
| 实时通信 | WebSocket |
| AI 模型 | Claude Sonnet 4.6 (BYOK) |

---

## 快速开始

### 环境要求

- Node.js >= 22.14.0
- npm >= 10.9.2

### 1. 克隆仓库

```bash
git clone https://github.com/veronicaji1024/codeTown.git
cd codeTown
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

在 `.env` 中填入：

```
SUPABASE_URL=你的 Supabase 项目 URL
SUPABASE_ANON_KEY=你的 Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase Service Role Key
```

同样在 `client/.env` 中填入前端变量：

```
VITE_SUPABASE_URL=你的 Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=你的 Supabase Anon Key
VITE_WS_URL=ws://localhost:3001
```

> Supabase 项目可在 [supabase.com](https://supabase.com) 免费创建。

### 4. 启动开发服务器

```bash
npm run dev
```

- 前端：http://localhost:5180
- 后端：http://localhost:3001

### 主要路由

| 路由 | 页面 |
|------|------|
| `localhost:5180/` | 登录 → 小镇地图 |
| `localhost:5180/level/1/desk` | L1 设计桌 |
| `localhost:5180/level/1/site` | L1 工地 |

### 5. 构建生产版本

```bash
npm run build
```

---

## 项目结构

```
codetown/
├── client/          # React 前端 SPA
│   └── src/
│       ├── components/
│       │   ├── map/          # 小镇地图
│       │   ├── workspace/    # 设计桌
│       │   ├── construction/ # 工地（AI Agent 工作区）
│       │   └── shared/       # 公共组件
│       ├── store/            # Zustand 状态管理
│       └── services/         # WebSocket 客户端
├── server/          # Express 后端
│   └── src/
│       ├── routes/           # API 路由
│       ├── services/         # 业务逻辑（AI 编排、技能注入等）
│       └── ws/               # WebSocket 处理
├── shared/          # 前后端共享类型定义
└── .env.example     # 环境变量模板
```

---

## 使用说明

1. **注册/登录** — 使用邮箱或手机号注册账号
2. **进入小镇** — 登录后看到你的虚拟小镇地图
3. **开始建造** — 点击 L1 建筑进入设计桌
4. **填写需求** — 告诉 AI 你想做什么
5. **去工地** — AI Agent 团队开始帮你写代码
6. **建筑竣工** — 你的 Web 应用上线，小镇多了一栋新建筑

---

## 已知问题（Demo 阶段）

- [ ] L2/L3/L4 关卡功能尚在开发中
- [ ] 项目分享链接功能未完全实现
- [ ] 移动端不支持（仅桌面端 1280px+）
- [ ] 部分 UI 动效可能出现异常

---

## 开发背景

CodeTown 最初作为 Oxford AI Hackathon（2026）参赛项目开发，目标是让从未写过代码的青少年，通过游戏化方式真正体验 AI 辅助编程的全流程。

---

*完整产品正在搭建中 — Stay tuned.*
