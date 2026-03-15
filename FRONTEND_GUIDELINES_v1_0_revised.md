# CodeTown 前端设计系统 v1.0

> **本文件是唯一视觉真相来源。** 所有颜色、字号、间距、组件均以此为准。AI 生成每一个组件前必须先查阅此文档。未在此定义的视觉决策不得随机发明——遇到未覆盖场景，遵循"最近原则"（参考最相似的已定义组件）或向人类确认。

---

## 目录

1. [设计哲学](#1-设计哲学)
2. [色彩系统](#2-色彩系统)
3. [字体系统](#3-字体系统)
4. [间距系统](#4-间距系统)
5. [圆角系统](#5-圆角系统)
6. [阴影系统](#6-阴影系统)
7. [布局与断点](#7-布局与断点)
8. [组件系统](#8-组件系统)
9. [动效系统](#9-动效系统)
10. [插画风格指南](#10-插画风格指南)
11. [图标系统](#11-图标系统-phosphor-icons)
12. [CSS 设计令牌](#12-css-设计令牌完整变量表)

---

## 1. 设计哲学

### 1.1 核心身份

CodeTown 是一个**高饱和度几何扁平动画世界**。视觉语言来自参考图中的侧脸 NPC——纯色色块拼贴、无描边、无阴影、无渐变、无高光纹理。颜色就是形体，形体就是颜色。

### 1.2 五条铁律

| # | 铁律 | 禁止的反面 |
|---|------|-----------|
| 1 | **扁平化** — 零阴影（除唯一例外：卡片 hover 时 2px offset 纯色阴影） | 任何 `box-shadow` 用模糊值、渐变背景 |
| 2 | **无描边** — 形体边缘由色块拼接定义，不用 `border` 区分形体 | 灰色 1px border 当分割线（用背景色差代替）|
| 3 | **高饱和** — 品牌色、角色色、组件色均高饱和，建筑色适度降饱 | 淡粉、淡蓝、灰调占主要版面 |
| 4 | **几何圆润** — 圆角固定为 4/8/12/16/24/full，不用奇数或非标准值 | `border-radius: 5px`、`7px`、`11px` |
| 5 | **全中文** — UI 文案全部中文，无英文标签（技术术语音译/意译均可） | 混用中英、按钮写 "Submit"、标题写 "Level 1" |
| 6 | **禁用 Emoji** — 任何情况下不得使用 Emoji 作为图标，统一使用 Phosphor Icons SVG 组件 | 用 🏗️、📁、✅ 等 Emoji 替代正式图标 |

### 1.3 情绪关键词

**温暖 · 活力 · 可爱 · 成就感 · 儿童友好但不幼稚**

目标用户 12–18 岁，设计感要接近「Nintendo Switch 游戏 UI」风格，而不是「小学课件」。高饱和色搭配米色底，保持视觉活力但不刺眼。

---

## 2. 色彩系统

> **规则：** 所有颜色只能从本节的定义列表中选取。不得使用任何未在此列出的十六进制值。

### 2.1 品牌主色（三色核心）

| 名称 | CSS 变量 | Hex | 用途 |
|------|----------|-----|------|
| 主蓝 | `--color-primary` | `#3385FF` | CTA按钮、激活状态、进行中工位边框、进度条、链接 |
| 松石绿 | `--color-secondary` | `#29665B` | 次要按钮、规则系统组件、成功完成建筑 |
| 珊瑚红 | `--color-accent` | `#E5594F` | 警示、工匠团队组件、高亮徽章、揭幕按钮 |

### 2.2 背景色层次（三层纵深）

| 名称 | CSS 变量 | Hex | 用途 |
|------|----------|-----|------|
| 米色（页面底） | `--bg-base` | `#F8F2E2` | 全局页面背景、小镇地图底色 |
| 象牙白（组件底） | `--bg-surface` | `#FFFDF7` | 所有白色卡片、面板、侧边栏背景 |
| 图纸蓝（设计区底） | `--bg-blueprint` | `#E8F4FD` | 设计图纸背景、蓝色网格底色 |
| 深底（模态遮罩） | `--bg-overlay` | `rgba(34,34,34,0.55)` | 弹窗遮罩 |

**木纹桌面（设计桌）：** 使用 CSS 径向渐变模拟，颜色仅限 `#C8A96E`（主）+ `#B8966A`（纹路阴影），细节见第 8.3 节。

### 2.3 九大组件强调色

每个游戏组件都有专属颜色，用于：文件夹标签左边框（4px）、组件卡片顶部色条（6px）、文件夹悬停背景色（10% opacity）。

| 组件 | CSS 变量 | Hex | Phosphor 图标 |
|------|----------|-----|---------------|
| 📋 委托单 | `--comp-brief` | `#3385FF` | `clipboard-text` |
| 🎨 装修方案 | `--comp-style` | `#C760A8` | `palette` |
| 📝 需求清单 | `--comp-req` | `#4CAF50` | `list-checks` |
| 🤖 工匠团队 | `--comp-agent` | `#ED6D57` | `users-three` |
| 🎒 技能包 | `--comp-skill` | `#F2C84B` | `backpack` |
| 📜 规则系统 | `--comp-rule` | `#29665B` | `scales` |
| 🔀 流程控制 | `--comp-flow` | `#9C27B0` | `git-fork` |
| 🔌 Plug | `--comp-plug` | `#00BCD4` | `plug` |
| 📚 图书馆 | `--comp-library` | `#795548` | `books` |

### 2.4 NPC & 工匠色（角色插画专用）

以下颜色**仅用于 SVG/PNG 插画**，不得用于 UI 元素。

**肤色系列**

| 名称 | Hex |
|------|-----|
| 深棕肤色 | `#8C5A40` |
| 中棕肤色 | `#DE9366` |
| 浅橙肤色 | `#F5D0B5` |
| 暖米肤色 | `#E8B88A` |

**发色系列**

| 名称 | Hex |
|------|-----|
| 黑发/深灰 | `#3A3A3A` |
| 珊瑚红发 | `#E5594F` |
| 芥末黄发 | `#E8C04F` |
| 银灰发 | `#AAAAAA` |
| 棕发 | `#8B5A2B` |

**NPC服装色系列（高饱和）**

| 名称 | Hex | 对应NPC角色参考 |
|------|-----|---------------|
| 鲑鱼粉上衣 | `#EF7267` | 规划师 Planner |
| 亮蓝上衣 | `#3385FF` | 建造者 Builder |
| 深松石绿上衣 | `#29665B` | 测试员 Tester |
| 紫粉上衣 | `#C760A8` | 审查员 Reviewer |
| 金黄格子上衣 | `#F2C84B` + `#ED6D57` | NPC 店员系列 |
| 黑色圆点上衣 | `#222222` + `#ED6D57` | NPC 长者 |

**五官/配饰（通用）**

| 名称 | Hex |
|------|-----|
| 眼睛/嘴 | `#222222` |
| 眼镜框 | `#ED6D57` |

### 2.5 建筑配色（降饱和，与NPC色保持和谐）

建筑使用 NPC 服装色的**降饱和版本**（HSL 饱和度 -25% 至 -35%，明度 +5% 至 +10%）。

| 名称 | Hex | 对应建筑类型 |
|------|-----|------------|
| 柔蓝屋顶 | `#5A9BD5` | L1 面包店 |
| 柔绿屋顶 | `#4A9E8F` | L2 游戏厅 |
| 柔橙外墙 | `#E8946A` | L3 我的家 |
| 柔黄外墙 | `#F5D76E` | L4 新闻看板 |
| 柔粉外墙 | `#E89FB0` | 广场/中心 |
| 浅灰（未完成） | `#C5C5C5` | 所有建筑灰色状态 |
| 纯白窗户 | `#FFFDF7` | 所有建筑窗框 |

### 2.6 语义状态色

| 状态 | CSS 变量 | Hex | 使用场景 |
|------|----------|-----|---------|
| 成功 | `--color-success` | `#4CAF50` | 工位完成、揭幕绿勾 |
| 警告 | `--color-warning` | `#FFC107` | 构建延迟提示 |
| 错误 | `--color-error` | `#F44336` | 构建失败、表单验证 |
| 进行中 | `--color-active` | `#3385FF` | 等同 `--color-primary` |
| 锁定 | `--color-locked` | `#9E9E9E` | 锁定文件夹、未解锁卡槽 |
| Teaching Moment | `--color-tm` | `#9C27B0` | TM 💡 边缘光晕、翻转卡片边框 |

### 2.7 中性色（文字与分隔）

| 名称 | CSS 变量 | Hex | 用途 |
|------|----------|-----|------|
| 主文字 | `--text-primary` | `#1A1A1A` | 标题、正文 |
| 次要文字 | `--text-secondary` | `#5A5A5A` | 说明、副标题 |
| 占位符 | `--text-placeholder` | `#AAAAAA` | input placeholder |
| 禁用文字 | `--text-disabled` | `#CCCCCC` | 锁定状态文字 |
| 分割线 | `--color-divider` | `#E8E2D4` | 用背景色差替代描边分割 |

### 2.8 色彩使用禁规

- ❌ 不得在同一界面区域同时使用超过 3 种高饱和组件色
- ❌ 文字颜色不得直接用品牌色（`#3385FF` 文字仅限链接/强调词）
- ❌ 不得使用纯白 `#FFFFFF`（用 `#FFFDF7` 象牙白代替）
- ❌ 不得使用纯黑 `#000000`（用 `#1A1A1A` 代替）
- ✅ 建筑图中高饱和色必须来自 2.5 节降饱和列表
- ✅ NPC/工匠插画色必须来自 2.4 节专属列表

---

## 3. 字体系统

### 3.1 字体家族

```css
/* 全局字体声明 */
font-family: 'OPPOSans', 'OPPO Sans', 'PingFang SC', 'Hiragino Sans GB',
             'Microsoft YaHei', sans-serif;
```

**主字体：OPPO Sans 4.0**（全中文界面唯一字体）

- 官方获取：https://www.coloros.com/article/A00000069/
- 引入方式：`@font-face` 本地托管或 CDN（项目根目录 `/fonts/OPPOSans-*.woff2`）
- 风格特征：等线风格、圆润几何、现代感强、与扁平插画风格天然匹配

**后备字体顺序：** PingFang SC（macOS）→ Hiragino Sans GB → Microsoft YaHei（Windows）→ sans-serif

```css
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
@font-face {
  font-family: 'OPPOSans';
  src: url('/fonts/OPPOSans-H.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
```

### 3.2 字号比例（基于 16px 基准，比例因子 1.25）

| 级别 | CSS 变量 | rem | px | 用途 |
|------|----------|-----|-----|------|
| xs | `--text-xs` | 0.75rem | 12px | 徽章、时间戳、token计数 |
| sm | `--text-sm` | 0.875rem | 14px | 辅助文字、说明、placeholder |
| base | `--text-base` | 1rem | 16px | 正文、卡片内容、按钮 |
| md | `--text-md` | 1.125rem | 18px | 卡片标题、侧边栏项 |
| lg | `--text-lg` | 1.25rem | 20px | 页面子标题、Tab 标签 |
| xl | `--text-xl` | 1.5rem | 24px | 页面主标题、模态标题 |
| 2xl | `--text-2xl` | 2rem | 32px | 英雄标题、关卡数字 |
| 3xl | `--text-3xl` | 2.5rem | 40px | 揭幕庆祝文字 |

### 3.3 字重规范

| 用途 | 字重值 | Font-weight |
|------|-------|-------------|
| 正文、说明 | Regular | 400 |
| 按钮、标签、侧边栏 | Medium | 500 |
| 卡片标题、Tab、组件名 | Bold | 700 |
| 关卡数字、揭幕标题 | Heavy | 900 |

### 3.4 行高 & 字间距

| 场景 | line-height | letter-spacing |
|------|-------------|----------------|
| 正文段落 | 1.75 | 0.02em |
| 标题（xl以上） | 1.2 | -0.01em |
| 按钮/标签 | 1 | 0.04em |
| 卡片短描述 | 1.5 | 0.01em |
| Teaching Moment 文本 | 1.8 | 0.02em |

### 3.5 文字颜色规则

- 正文文字：`--text-primary` `#1A1A1A`（不用纯黑）
- 浅色背景（`--bg-surface`）上：`--text-primary`
- 深色背景（组件强调色）上：`#FFFDF7`（象牙白）
- 建筑灰色状态下：`--text-disabled` `#CCCCCC`
- 链接/强调词：`--color-primary` `#3385FF`，hover 下划线

---

## 4. 间距系统

### 4.1 基础单元：8px 网格

**所有 margin、padding、gap 必须是 4px 的倍数。优先使用 8px 倍数。**

```
4px  = 基础最小间距（图标内边距、紧密列表项）
8px  = 标准最小组件间距
12px = 组件内次要间距
16px = 标准组件内边距
20px = 大组件内边距
24px = 卡片内边距（标准）
32px = 组件外间距、section 间距
40px = 页面水平内边距（桌面）
48px = 大 section 间距
64px = 页面顶部/底部空间
```

### 4.2 间距刻度表

| Token | CSS 变量 | 值 |
|-------|----------|-----|
| space-1 | `--space-1` | 4px |
| space-2 | `--space-2` | 8px |
| space-3 | `--space-3` | 12px |
| space-4 | `--space-4` | 16px |
| space-5 | `--space-5` | 20px |
| space-6 | `--space-6` | 24px |
| space-8 | `--space-8` | 32px |
| space-10 | `--space-10` | 40px |
| space-12 | `--space-12` | 48px |
| space-16 | `--space-16` | 64px |
| space-20 | `--space-20` | 80px |

### 4.3 组件内边距规范

| 组件类型 | padding |
|---------|---------|
| 小按钮（sm） | `8px 16px` |
| 标准按钮 | `12px 24px` |
| 大按钮（CTA） | `16px 32px` |
| 游戏组件卡片 | `20px 20px` |
| 工位卡片 | `16px 16px` |
| NPC 气泡 | `12px 16px` |
| Mirror 气泡 | `12px 16px` |
| 文件夹侧边栏项 | `10px 16px` |
| 模态框内容区 | `32px 32px` |
| Token 面板 | `8px 16px` |

---

## 5. 圆角系统

**使用以下固定值，不得使用其他值。**

| Token | CSS 变量 | 值 | 用途 |
|-------|----------|-----|------|
| radius-sm | `--radius-sm` | 4px | 小徽章、标签 |
| radius-md | `--radius-md` | 8px | 按钮、输入框、小卡片 |
| radius-lg | `--radius-lg` | 12px | 游戏组件卡片、工位卡片 |
| radius-xl | `--radius-xl` | 16px | 模态框、大面板 |
| radius-2xl | `--radius-2xl` | 24px | Mirror气泡（聊天风格）|
| radius-full | `--radius-full` | 9999px | 徽章、头像圆形、进度点 |

**NPC/工匠气泡用 `--radius-2xl` + 单角尖角（CSS clip-path 或 `border-radius` 覆写单角为 4px）**

---

## 6. 阴影系统

### 6.1 原则

CodeTown 是**无阴影世界**。唯一允许的阴影效果是：
1. 卡片 hover 时的**纯色偏移阴影**（无模糊值）
2. 激活工位的**发光边框**（用 `box-shadow` 模拟 glow，禁用于非工地场景）

### 6.2 阴影令牌

```css
/* 卡片 hover 阴影：纯色，2-3px offset，0 blur */
--shadow-card-hover: 3px 3px 0px var(--comp-color); /* comp-color = 该组件的专属色 */
--shadow-card-hover-generic: 3px 3px 0px #1A1A1A;   /* 通用版本 */

/* 激活工位发光：仅用于 .agent-workstation--active */
--shadow-agent-active: 0 0 0 3px #3385FF, 0 0 12px rgba(51, 133, 255, 0.35);

/* Teaching Moment 紫金光晕：仅用于 .tm-glow */
--shadow-tm: 0 0 0 3px #9C27B0, 0 0 16px rgba(156, 39, 176, 0.4);

/* 模态框底部托浮感 */
--shadow-modal: 6px 6px 0px rgba(26, 26, 26, 0.15);
```

### 6.3 完全禁止的阴影写法

```css
/* ❌ 以下任何写法均违反设计规范 */
box-shadow: 0 4px 12px rgba(0,0,0,0.1);
box-shadow: 0 2px 8px rgba(0,0,0,0.15);
filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
text-shadow: any;
```

---

## 7. 布局与断点

### 7.1 响应式断点

| 断点名 | CSS 变量 | min-width | 场景 |
|--------|----------|-----------|------|
| desktop | `--bp-desktop` | 1024px | 桌面端（最低优化目标）|
| wide | `--bp-wide` | 1280px | 桌面端标准（主要设计基准）|
| ultrawide | `--bp-ultrawide` | 1440px | 大屏增强 |

**设计基准：1280px 宽 × 800px 高（1280px 为主要优化目标）。不支持移动端。**

```css
/* 媒体查询写法 */
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1280px) { /* wide - 主要设计目标 */ }
```

### 7.2 全局页面结构

```
┌─────────────────────────────────────┐
│  顶部栏 (TopBar) — 固定 48px 高      │  bg: --bg-surface
│  logo + 关卡标识 + token面板 + 头像  │
├─────────────────────────────────────┤
│  页面内容区（各页差异见下文）          │  bg: --bg-base (#F8F2E2)
│  max-width: none（全宽）             │
│  最小高度: calc(100vh - 48px)        │
└─────────────────────────────────────┘
```

**TopBar 规格：**
- 高度：48px（固定，`position: sticky; top: 0; z-index: 100`）
- 背景：`--bg-surface` `#FFFDF7`
- 底部分割线：`2px solid --color-divider`（**用描边代替阴影**）
- Logo：左侧，字体 `--text-xl` Bold，颜色 `--color-primary`
- 关卡标识：Logo右侧，`--text-sm` Medium，背景色用对应关卡建筑色（降饱和版）
- Token面板：右侧偏左，紧凑型（见组件 8.10）
- 用户头像：最右侧，32px 圆形，`--radius-full`

### 7.3 小镇地图页布局

```
┌─────────────────────────────────────┐
│  TopBar（无关卡标识）                  │
├─────────────────────────────────────┤
│                                     │
│    小镇 SVG 地图                      │  bg: --bg-base
│    中心：广场（固定）                  │  四栋建筑可点击
│    四角方向：L1 L2 L3 L4 建筑         │
│                                     │
│    建筑点击区：≥60×60px 热区           │
│    建筑标签：建筑下方，--text-sm Bold   │
│                                     │
└─────────────────────────────────────┘
```

- 地图 SVG：`width: 100%; max-width: 900px; margin: 0 auto`
- 建筑三种状态通过 CSS class 切换：`.building--locked` / `.building--available` / `.building--completed`

### 7.4 设计桌页布局

```
1280px 宽度下：

┌────────────────────────────────────────────────────┐
│  TopBar + Tab 导航（[🗒️ 设计桌] [🏗️ 工地(灰)]）      │ 48px
├──────────┬─────────────────────────────────────────┤
│  文件夹   │  图纸区 (flex-1)                         │
│  侧边栏   │                                         │
│  200px   │  ┌───────────────────────────────────┐   │
│  固定宽   │  │  木纹桌面（fixed bg）               │   │
│           │  │  ┌────────────────────────────┐   │   │
│  9个文件夹│  │  │  蓝色网格图纸（纵向滚动）      │   │   │
│  纵向排列 │  │  │  卡槽 + 已填卡片              │   │   │
│           │  │  └────────────────────────────┘   │   │
│           │  │  sticky 底部：[📐制定工作计划]     │   │
│           │  └───────────────────────────────────┘   │
└──────────┴─────────────────────────────────────────┘
```

- 文件夹侧边栏：`width: 200px; flex-shrink: 0; overflow-y: auto`；背景 `--bg-surface`；右侧 `2px solid --color-divider`
- 木纹桌面：CSS `background` 固定（`background-attachment: local`），`#C8A96E`
- 蓝色网格图纸：绝对定位在桌面上，`background-color: --bg-blueprint #E8F4FD`，网格纹路用 `background-image: linear-gradient`（见 8.3 节）
- 图纸内边距：`24px`
- 卡槽间距：`gap: 16px`，两列网格 `grid-template-columns: 1fr 1fr`

### 7.5 工地页布局

```
1280px 宽度下：

┌────────────────────────────────────────────────────┐
│  TopBar + Tab 导航（[🗒️ 设计桌] [🏗️ 工地 ●]）        │ 48px
├─────────────────────────────┬──────────────────────┤
│  Agent 区（左 65%）           │  Mirror 区（右 35%）  │
│                             │                      │
│  工位卡片 × N（竖向排列）     │  实时思考气泡          │
│  每个 160×200px             │  从下往上堆叠          │
│  当前激活：蓝色发光边框       │  最新气泡在底部        │
│  已完成：绿色勾               │  字符流式逐个出现      │
│  失败：红色叉                 │  --bg-surface 背景    │
│                             │                      │
├─────────────────────────────┴──────────────────────┤
│  底部进度轨道（固定）：● ◉ ○ ○ ○                     │ 48px
│  + Token 面板（右对齐）                              │
└────────────────────────────────────────────────────┘
```

- Agent 区：`flex: 0 0 65%; overflow-y: auto; padding: 24px`
- Mirror 区：`flex: 0 0 35%; position: sticky; top: 48px; height: calc(100vh - 96px); overflow-y: auto; padding: 16px; background: --bg-surface; border-left: 2px solid --color-divider`
- 底部进度轨道：`position: fixed; bottom: 0; left: 0; right: 0; height: 48px; background: --bg-surface; border-top: 2px solid --color-divider; z-index: 50`

---

## 8. 组件系统

> 每个组件规格均包含：尺寸、颜色、字体、状态变化。

### 8.1 按钮 (Button)

#### 变体

**Primary（主要 CTA）**
```
背景:     --color-primary (#3385FF)
文字:     #FFFDF7  font-weight: 700  font-size: --text-base
圆角:     --radius-md (8px)
内边距:   12px 24px（标准）| 16px 32px（大）
边框:     none
Hover:    背景 #2470E8（加深 10%）+ translateY(-1px)
Active:   背景 #1B5FC7 + translateY(0)
Disabled: 背景 #CCCCCC + 文字 #AAAAAA + cursor: not-allowed
```

**Secondary（次要）**
```
背景:     --bg-surface (#FFFDF7)
文字:     --text-primary (#1A1A1A)  font-weight: 500
边框:     2px solid --color-divider (#E8E2D4)
圆角:     --radius-md
Hover:    边框色改为 --color-primary (#3385FF) + 文字改为 --color-primary
```

**Danger（危险/删除）**
```
背景:     #FFF0EF
文字:     --color-error (#F44336)  font-weight: 500
边框:     2px solid #FFCDD2
圆角:     --radius-md
Hover:    背景 #FFCDD2 + 边框 --color-error
```

**Ghost（幽灵）**
```
背景:     transparent
文字:     --text-secondary (#5A5A5A)
边框:     none
Hover:    背景 rgba(26,26,26,0.06)
```

**CTA 大按钮（「开始建造」「制定工作计划」）**
```
背景:     使用 Primary 样式
高度:     56px
宽度:     calc(100% - 48px)（图纸底部，居中）
字号:     --text-lg  font-weight: 700
图标:     左侧 Phosphor 图标 20px（play / ruler）
圆角:     --radius-lg (12px)
hover 阴影: --shadow-card-hover-generic
```

#### 图标按钮
```
尺寸:     32×32px（sm）| 40×40px（md）
圆角:     --radius-md
图标尺寸: 16px（sm）| 20px（md）
背景:     transparent
Hover:    背景 rgba(26,26,26,0.08)
```

### 8.2 输入框 (Input)

```
背景:     --bg-surface (#FFFDF7)
边框:     2px solid --color-divider (#E8E2D4)
圆角:     --radius-md (8px)
内边距:   10px 14px
字号:     --text-base (16px)  字重: 400
颜色:     --text-primary
Placeholder: --text-placeholder (#AAAAAA)
Focus:    边框改为 2px solid --color-primary (#3385FF)，无外发光
Disabled: 背景 #F0ECE0  文字 --text-disabled
Error:    边框 2px solid --color-error (#F44336)
高度:     40px（单行）| auto（多行 textarea，min-height: 80px）
```

**多行文本框（卡片内容）：**
```
resize: vertical
min-height: 80px
max-height: 320px
line-height: 1.75
```

### 8.3 游戏组件卡片（九大组件）

这是设计桌的核心视觉元素，每种组件有独立颜色身份。

```
┌──────────────────────────────┐
│ ████ 顶部色条 6px              │ ← 该组件的 --comp-xxx 色
│                              │
│  [图标 20px] 组件名           │ ← --text-md Bold, --text-primary
│  ─────────────────           │ ← 分割线 --color-divider
│                              │
│  卡片内容区域                 │ ← 根据组件类型不同
│  （选择/输入/列表等）           │
│                              │
│  底部状态行                   │ ← --text-xs --text-secondary
└──────────────────────────────┘
```

**通用卡片规格：**
```
宽度:         100%（自适应卡槽）
最小高度:     120px
最大高度:     400px（内容超出后内部滚动）
背景:         --bg-surface (#FFFDF7)
圆角:         --radius-lg (12px)
内边距:       20px
顶部色条:     6px solid 组件色（border-top 或 absolute 定位 div）
Hover:        translateY(-2px) + --shadow-card-hover（用组件色）
已填满状态:   顶部色条保持，右上角显示绿色 ✓ 徽章
```

**各组件卡片内容区细节：**

| 组件 | 内容区 UI |
|------|----------|
| 📋 委托单 | 单行文本输入（项目名称）+ 两行文本区（一句话描述）|
| 🎨 装修方案 | 2×2 网格选择卡（L1 预设风格），或 textarea（L2+）|
| 📝 需求清单 | 可增删的 checkbox 列表 + 底部 [+ 添加需求] 按钮 |
| 🤖 工匠团队 | 4 个角色行（Planner/Builder/Tester/Reviewer），每行有开关+描述输入框（L2+）|
| 🎒 技能包 | 下拉选择（预设技能）+ 自定义文本框 |
| 📜 规则系统 | 可增删规则列表，每条有类型选择器（前置检查/后置验证）|
| 🔀 流程控制 | 4种指令选择器（先/后 · 同时 · 持续改进 · 让我看看）+ 任务选择器 |
| 🔌 Plug | 预制 Plug 选择卡（图片素材/地图/魔法连接），含参数输入框 |
| 📚 图书馆 | 粘贴文本区 + 上传按钮，资料列表（可删除）|

### 8.4 卡槽 (Slot)

卡槽是设计图纸上接收卡片的容器。

**三种状态：**

```
必填卡槽（空）:
  边框: 2px dashed --color-primary (#3385FF)
  背景: rgba(51, 133, 255, 0.05)
  动画: border-color 脉冲闪烁 2s ease-in-out infinite（亮暗交替）
  标签: 左上角 --text-xs Bold 组件色 + 组件名

可选卡槽（空）:
  边框: 2px dashed --color-divider (#E8E2D4)
  背景: transparent
  标签: 左上角 --text-xs --text-disabled + 组件名 + "(可选)"

锁定卡槽:
  背景: #F0ECE0
  边框: none
  文字: --text-disabled  居中显示 🔒 + "第X关解锁"
  cursor: not-allowed

拖拽悬停（drag-over）:
  边框: 2px solid --color-primary
  背景: rgba(51, 133, 255, 0.12)
  transform: scale(1.02)

已填充:
  border: none（卡片填满整个卡槽区域）
  显示对应的组件卡片
```

**卡槽尺寸：**
```
最小高度: 100px（空态）
宽度: 100%（自适应网格列）
圆角: --radius-lg (12px)
```

### 8.5 文件夹侧边栏 (Folder Sidebar)

```
侧边栏容器:
  width: 200px
  background: --bg-surface
  border-right: 2px solid --color-divider
  padding-top: 16px
  overflow-y: auto

文件夹项:
  高度: 40px
  padding: 10px 16px
  cursor: pointer
  display: flex; align-items: center; gap: 10px
  左侧色条: 4px solid 组件色（border-left）
  文字: --text-sm Medium --text-primary
  图标: Phosphor 图标 16px 组件色

文件夹项 Hover:
  背景: 组件色 10% opacity
  左侧色条: 4px solid 组件色（颜色不变，但粗起视觉感）

文件夹项 Active（展开中）:
  背景: 组件色 15% opacity
  文字: 组件色 + Bold

锁定文件夹:
  左侧色条: 4px solid --color-locked (#9E9E9E)
  图标: lock 图标（灰色）
  文字: --text-disabled
  cursor: not-allowed

展开子菜单（卡片选项列表）:
  背景: --bg-base (#F8F2E2)
  每个选项: 32px 高, padding: 6px 16px 6px 28px
  字号: --text-sm  字色: --text-secondary
  Hover: 背景 rgba(26,26,26,0.06) + 文字 --text-primary
```

### 8.6 Tab 导航（设计桌 ↔ 工地）

```
容器: 右上角固定，TopBar 内右侧区域
两个 Tab 标签，横向排列，gap: 8px

Tab 标签（非激活）:
  背景: --bg-base (#F8F2E2)
  边框: 2px solid --color-divider
  圆角: --radius-md (8px)
  内边距: 8px 16px
  字号: --text-sm  字重: 500
  颜色: --text-secondary

Tab 标签（激活）:
  背景: --color-primary (#3385FF)
  边框: none
  颜色: #FFFDF7  字重: 700

工地 Tab 灰色（不可用）:
  背景: #F0ECE0
  颜色: --text-disabled
  cursor: not-allowed

工地 Tab 进行中指示器（●）:
  右上角 8px 圆点
  颜色: --color-accent (#E5594F)
  动画: scale 脉冲 1.5s infinite
```

### 8.7 工位卡片 (Agent Workstation Card)

工地页面的核心元素，代表一个 AI 工匠的工位。

```
尺寸: 宽度 100%（在 Agent 区内自适应），高度 160px

容器布局（flex row）:
  左侧: 工匠插画 80×80px（SVG，CSS 动画）
  右侧: 工匠信息区（flex column）
    - 工匠名称: --text-md Bold --text-primary
    - 任务标签: --text-sm --text-secondary（当前任务描述）
    - 进度条: 高度 6px，圆角 --radius-full
    - 💡图标（有TM时显示，右下角）

背景: --bg-surface
圆角: --radius-lg (12px)
内边距: 16px
gap（工位间）: 12px

状态样式:
  等待中: 边框 2px solid --color-divider
  进行中（激活）: 边框 3px solid --color-primary + --shadow-agent-active
                  + 工匠动画: float 浮动 2s ease-in-out infinite
  已完成: 边框 2px solid --color-success (#4CAF50)
          右上角绿色勾 ✓ 徽章
          工匠动画: 弹跳 1次 (bounce)
  失败: 边框 2px solid --color-error (#F44336)
        工匠动画: 摇晃 (shake) 0.4s
  有TM（翻转就绪）:
        左边框 4px solid --color-tm (#9C27B0) + --shadow-tm

进度条颜色:
  空:    背景色 --color-divider
  进行中: --color-primary
  完成:  --color-success
  失败:  --color-error
```

**Teaching Moment 翻转卡片背面（CSS 3D flip）：**
```
正面: 工位卡片（如上）
背面:
  背景: #1A1A2E（深夜蓝，与正面形成对比）
  边框: 2px solid --color-tm (#9C27B0)
  圆角: --radius-lg
  内容:
    标题: 💡 + TM名称  字号: --text-md  颜色: #F2C84B  字重: 700
    分割线: 1px solid rgba(156,39,176,0.3)
    正文: TM 知识点文字  字号: --text-sm  颜色: #E8E2D4  line-height: 1.8
    底部标签: "你做的 = 专业人士做的"  --text-xs  颜色: --color-tm opacity 0.7

翻转动画:
  transform: rotateY(180deg)
  transition: transform 0.4s ease
  transform-style: preserve-3d
  backface-visibility: hidden
  触发: hover（桌面端鼠标悬停）
```

### 8.8 Mirror 思考气泡

```
容器（右侧35%区域）:
  display: flex; flex-direction: column; justify-content: flex-end
  gap: 8px
  overflow-y: auto
  padding: 16px
  background: --bg-surface

单个气泡:
  background: --bg-base (#F8F2E2)
  圆角: 20px 20px 20px 4px（左下角小圆角=气泡尾）
  内边距: 12px 16px
  最大宽度: 90%
  align-self: flex-start
  字号: --text-sm  行高: 1.75
  颜色: --text-primary
  动画: 从底部 fadeInUp (translateY 20px → 0, opacity 0→1, 0.3s)

气泡工匠名称标签（气泡顶部）:
  字号: --text-xs  字重: 700
  颜色: 该工匠的服装色（见 2.4 NPC服装色）
  margin-bottom: 4px

流式输出光标:
  | 竖线光标
  animation: blink 0.8s step-end infinite
  颜色: --color-primary

"思考中…"占位气泡:
  三个点动画（dot-dot-dot bounce stagger 0.2s）
  透明度 0.6
```

### 8.9 NPC 对话气泡

```
布局: 头像（左）+ 气泡（右），或气泡（左）+ 头像（右，用于回应方向变化）
头像: 40×40px 圆形，overflow: hidden，显示 NPC SVG 侧脸图像

气泡:
  background: --bg-surface (#FFFDF7)
  边框: 2px solid --color-divider
  圆角: 4px 20px 20px 20px（左上角=气泡尾，靠近头像侧）
  内边距: 12px 16px
  最大宽度: 320px
  字号: --text-base  行高: 1.75

入场动画: 气泡从左 slideIn (translateX -20px → 0, opacity 0→1, 0.3s ease-out)
不阻断操作（不是模态，pointer-events: none 除气泡内关闭按钮外）

关闭方式: 气泡右上角 × 图标按钮（16×16px）
自动消失: 8s 后 fadeOut（除非是需要操作的提示）
```

### 8.10 Token 面板

```
位置: TopBar 右侧，或工地底部进度轨道左区域
布局: 水平排列，gap: 16px

内容块（每块）:
  字号: --text-xs  颜色: --text-secondary
  数值: --text-sm  字重: 700  颜色: --text-primary

内容项:
  - Token用量: [用量数字] / [上限]  图标: coin (16px, #F2C84B)
  - ¥成本: ¥[0.00]  图标: 无
  - 进度: [X]/[Y] 步骤  图标: 无

进度条（工地底部专属）:
  高度: 8px
  宽度: 200px
  背景: --color-divider
  填充: 渐变 #3385FF → #29665B（从左到右）
  圆角: --radius-full
  动画: 宽度变化 transition 0.5s ease
```

### 8.11 进度轨道（底部）

```
位置: 工地页底部，position: fixed; bottom: 0
高度: 48px
背景: --bg-surface
border-top: 2px solid --color-divider

轨道节点（横向排列，flex, gap: 8px, 居中）:
  已完成节点 ●: 16px 圆形, 背景 --color-success (#4CAF50)
  进行中节点 ◉: 16px 圆形, 边框 3px solid --color-primary, 内圆 8px primary色
                animation: scale 脉冲 1.5s infinite
  待办节点 ○: 16px 圆形, 边框 2px solid --color-divider, 背景 transparent

节点连线: 节点之间 flex-grow: 1 的 2px 线段
  已完成连线: --color-success
  其他连线:   --color-divider

节点 tooltip: hover 显示任务名称（absolute 定位，上方弹出）
```

### 8.12 模态框 (Modal)

```
遮罩: background --bg-overlay rgba(34,34,34,0.55); backdrop-filter: blur(2px)
容器:
  background: --bg-surface
  圆角: --radius-xl (16px)
  内边距: 32px
  宽度: min(560px, calc(100vw - 48px))
  阴影: --shadow-modal (6px 6px 0px rgba(26,26,26,0.15))
  入场动画: scale 0.9→1 + opacity 0→1, 0.25s ease-out

标题: --text-xl Bold --text-primary
关闭按钮: 右上角，32×32px ghost 图标按钮

BYOK 许可证面板（特殊模态）:
  标题图标: key Phosphor 图标 32px --color-primary
  标题: "建筑许可证"
  副标题: --text-sm --text-secondary "输入你的 Opencode API Key 开始建造"
  输入框: 全宽, placeholder: "sk-..."
  底部链接: "如何获取 Opencode API Key？" --text-xs --color-primary
  确认按钮: Primary 大按钮 "开工！"
```

### 8.13 徽章 & 标签 (Badge / Tag)

```
徽章（状态显示）:
  背景: 状态色 15% opacity
  文字: 状态色  字号: --text-xs  字重: 700
  圆角: --radius-full
  内边距: 2px 8px
  边框: 1px solid 状态色 40% opacity

  变体: success / warning / error / active / locked / tm
  示例:
    .badge-success:  bg #E8F5E9, color #4CAF50
    .badge-error:    bg #FFEBEE, color #F44336
    .badge-locked:   bg #F5F5F5, color #9E9E9E

关卡标签（L1/L2/L3/L4）:
  背景: 对应建筑降饱和色 30% opacity
  边框: 2px solid 降饱和色
  文字: 降饱和色 Bold  字号: --text-xs
  圆角: --radius-sm (4px)
  内边距: 2px 6px
```

### 8.14 建筑卡片（地图上）

```
容器: SVG 内 <g> 组，hover 使用 CSS

建筑图形:
  未激活（灰色）: 所有色填充改为 #C5C5C5
  可进入（灰色无锁）: 所有色填充 #C5C5C5 + cursor: pointer
                      hover: 整体 brightness(1.1) + scale(1.05)
  已完成（彩色）: 原始降饱和配色（见 2.5 节），CSS transition 1s ease

点击热区: min 60×60px（不管建筑图形多小，热区保证可点击）

建筑名称标签（图形下方 8px）:
  字号: --text-sm  字重: 700
  颜色: 已完成→建筑色；未激活→--text-disabled
  背景: --bg-surface 80% opacity  圆角: --radius-sm  内边距: 2px 8px

锁定标识: 建筑右上角 lock 图标 20px #9E9E9E

完成状态切换动画: 灰色→彩色 CSS transition 1.5s ease（三阶段：灰→灰+透明彩→纯彩）
```

### 8.15 揭幕时刻 (Reveal Moment)

```
流程动画时序:
  0ms:    所有工位 check-circle 图标逐个出现（stagger 100ms/个）
  200ms:  工位从中向两侧滑开（translateX, 300ms ease-in-out）
  500ms:  iframe 从 opacity 0 + scale 0.95 → opacity 1 + scale 1（400ms）
  900ms:  confetti 爆发（CSS 粒子，50个圆圈，颜色随机取自2.3组件色列表）
  1200ms: 底部按钮 fadeIn（「分享给朋友」+「回到小镇」）

confetti 粒子规格:
  形状: 圆形 8×8px + 矩形 4×12px 混合
  颜色池: #3385FF, #C760A8, #4CAF50, #ED6D57, #F2C84B, #29665B, #E5594F
  动画: 从中心爆出，random rotate + random velocity，gravity 下落，2.5s 完成

「分享给朋友」按钮: Primary 大按钮，左侧 share-network 图标
「回到小镇」按钮: Secondary 大按钮，左侧 house 图标

缩小后的工匠小图标（揭幕后）:
  尺寸: 32×32px
  位置: 底部进度轨道区域，水平排列
  动画: 从工位位置 → 底部目标位置，path animation 0.5s ease-in-out
```

---

## 9. 动效系统

### 9.1 缓动函数

```css
/* 标准缓动（大多数 UI 过渡）*/
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* 入场（元素进入屏幕）*/
--ease-enter: cubic-bezier(0, 0, 0.2, 1);

/* 出场（元素离开屏幕）*/
--ease-exit: cubic-bezier(0.4, 0, 1, 1);

/* 弹性（卡片 snap、工匠弹跳）*/
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 线性（进度条连续动画）*/
--ease-linear: linear;
```

### 9.2 时长规范

| Token | CSS 变量 | 值 | 用途 |
|-------|----------|-----|------|
| instant | `--dur-instant` | 80ms | 微交互（按钮 active 反馈）|
| fast | `--dur-fast` | 150ms | hover 状态切换 |
| standard | `--dur-standard` | 250ms | 面板展开/收起、模态入场 |
| slow | `--dur-slow` | 400ms | 卡片翻转（TM）、揭幕工位滑开 |
| story | `--dur-story` | 600ms | 场景切换、建筑变色 |

### 9.3 具体动效规格

| 动效名 | 触发场景 | CSS 实现 | 时长/缓动 |
|--------|---------|---------|---------|
| `slideInLeft` | NPC气泡入场 | `translateX(-20px) opacity(0) → normal` | 300ms `--ease-enter` |
| `fadeInUp` | Mirror气泡入场 | `translateY(20px) opacity(0) → normal` | 300ms `--ease-enter` |
| `cardSnap` | 卡片落槽归位 | `scale(1.05) → scale(1)` | 200ms `--ease-bounce` |
| `cardHover` | 卡片悬浮 | `translateY(-2px)` | 150ms `--ease-standard` |
| `agentFloat` | 工匠等待动画 | `translateY(0) → translateY(-6px) → translateY(0)` | 2s `ease-in-out` infinite |
| `agentBounce` | 工匠完成动画 | `translateY(0) → translateY(-12px) → translateY(2px) → translateY(0)` | 0.5s `--ease-bounce` once |
| `agentShake` | 工匠失败动画 | `rotate(-3deg) → rotate(3deg)` × 3 | 0.4s linear |
| `agentPulse` | 工匠工作动画 | `scale(1) → scale(1.05) → scale(1)` | 1.2s ease-in-out infinite |
| `tmGlowPulse` | TM 光晕脉冲 | `box-shadow 小 → 大 → 小` | 2s ease-in-out infinite |
| `tmFlip` | TM 翻转（hover） | `rotateY(0) → rotateY(180deg)` | 400ms `--ease-standard` |
| `buildingReveal` | 建筑变色 | 灰色 → 彩色 `filter: saturate(0)→saturate(1)` | 1500ms `--ease-story` |
| `slotPulse` | 必填卡槽脉冲 | `border-color opacity(1) → opacity(0.4) → opacity(1)` | 2s ease-in-out infinite |
| `confettiBurst` | 揭幕庆祝 | 粒子爆炸（见8.15）| 2500ms |
| `workstationSlide` | 工位揭幕滑开 | `translateX(0) → translateX(±200%)` | 300ms `--ease-exit` stagger 50ms |
| `progressDot` | 进行中节点脉冲 | `scale(1) → scale(1.3) → scale(1)` | 1.5s ease-in-out infinite |
| `typewriterCursor` | Mirror光标闪烁 | `opacity 1 → 0` | 0.8s step-end infinite |
| `modalEntry` | 模态入场 | `scale(0.9) opacity(0) → normal` | 250ms `--ease-enter` |

**网格图纸 CSS 实现（蓝色设计图纸背景）：**
```css
.blueprint-grid {
  background-color: #E8F4FD;
  background-image:
    linear-gradient(rgba(51, 133, 255, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(51, 133, 255, 0.15) 1px, transparent 1px),
    linear-gradient(rgba(51, 133, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(51, 133, 255, 0.06) 1px, transparent 1px);
  background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
}
```

**木纹桌面 CSS 实现：**
```css
.wood-desk {
  background-color: #C8A96E;
  background-image:
    repeating-linear-gradient(
      98deg,
      transparent,
      transparent 8px,
      rgba(184, 150, 106, 0.35) 8px,
      rgba(184, 150, 106, 0.35) 9px
    ),
    repeating-linear-gradient(
      2deg,
      transparent,
      transparent 30px,
      rgba(200, 165, 100, 0.2) 30px,
      rgba(200, 165, 100, 0.2) 31px
    );
}
```

---

## 10. 插画风格指南

> 本节规范所有 NPC、工匠角色和建筑插画的创作标准。SVG/PNG 插画必须遵守以下规则。

### 10.1 核心画风定律

1. **纯色填充** — 每个形体区域用单一纯色填充，零渐变、零高光、零纹理
2. **无外描边** — 形体之间的边界由色块颜色差异自然形成，不画黑色轮廓线
3. **几何形体** — 头部为圆角矩形，躯干为梯形，发型为不规则几何色块
4. **侧脸视角** — 所有 NPC/工匠均为 3/4 侧脸（参考图中的角色风格）
5. **简化五官** — 眼睛：1-2 个实心圆点或短横线（`#222222`）；鼻子：L形短线；嘴：弧线或短横线
6. **比例夸张** — 头身比约 1:1.2（大头小身，Q版比例），增加亲和力

### 10.2 四个工匠角色规格

每个工匠 = 80×80px SVG（工位卡片内）+ 160×160px SVG（独立展示）

| 角色 | 发色 | 服装色 | 配饰 |
|------|------|--------|------|
| Planner（规划师） | `#3A3A3A` 深灰短发 | `#EF7267` 鲑鱼粉上衣 | 无（或铅笔耳后）|
| Builder（建造者） | `#E8C04F` 芥末黄发 | `#3385FF` 亮蓝工装 | 安全帽 `#F2C84B` |
| Tester（测试员） | `#E5594F` 珊瑚红卷发 | `#29665B` 松石绿上衣 | 眼镜框 `#ED6D57` |
| Reviewer（审查员）| `#AAAAAA` 银灰发 | `#C760A8` 紫粉上衣 | 黑色帽子 `#222222` |

**肤色分配（多元化）：**
- Planner：`#8C5A40` 深棕肤
- Builder：`#DE9366` 中棕肤
- Tester：`#F5D0B5` 浅橙肤
- Reviewer：`#E8B88A` 暖米肤

### 10.3 工匠 CSS 动画规格

工匠动画通过 CSS `transform` 实现，**不改变 SVG 文件本身**：

```css
/* 等待状态 */
.craftsman--idle { animation: agentFloat 2s ease-in-out infinite; }
/* 工作状态 */
.craftsman--working { animation: agentPulse 1.2s ease-in-out infinite; }
/* 工具图标出现（伪元素或叠层） */
.craftsman--working::after { content: ""; /* 工具图标SVG背景 */ }
/* 完成状态 */
.craftsman--done { animation: agentBounce 0.5s var(--ease-bounce); }
/* 失败状态 */
.craftsman--failed { animation: agentShake 0.4s linear; }
```

### 10.4 建筑插画规范

建筑 = 正视图，几何风格，`无透视`（平面 2D）

**结构规则：**
1. 屋顶：三角形或平顶，颜色取 2.5 节降饱和屋顶色
2. 外墙：矩形，颜色取 2.5 节降饱和外墙色
3. 窗户：小正方形/矩形，颜色 `#FFFDF7`（象牙白）
4. 门：矩形，颜色比外墙暗 15%
5. 装饰：最多 2 种装饰元素（花盆、招牌等），颜色取自组件色列表

**四栋建筑设计意图：**

| 建筑 | 关卡 | 主色 | 屋顶色 | 特征元素 |
|------|------|------|--------|---------|
| 面包店 | L1 | `#E8946A` | `#5A9BD5` | 招牌（面包图案）、橱窗 |
| 游戏厅 | L2 | `#F5D76E` | `#4A9E8F` | 霓虹感窗户、游戏机轮廓 |
| 我的家 | L3 | `#E89FB0` | `#E8946A` | 庭院、个性化装饰 |
| 新闻看板 | L4 | `#C5DFF5` | `#4A9E8F` | 大型广告牌、天线 |

**灰色（未完成）状态：** 所有颜色替换为 `#C5C5C5`（统一灰），窗户 `#DDDDDD`，门 `#B5B5B5`

### 10.5 NPC 角色（6 个镇民）

比工匠更多样，用于地图场景和对话气泡。

每个 NPC = 40×40px 头像 SVG（侧脸，无身体，仅头/颈/少量肩部）

设计要求：
- 使用不同肤色+发色+服装色组合，保证多元化
- 服装色从 2.4 节 NPC服装色列表选择
- 不重复任何工匠的外观组合

---

## 11. 图标系统 (Phosphor Icons)

### 11.1 安装方式

```bash
npm install @phosphor-icons/react
```

```tsx
// 使用示例
import { ClipboardText, Palette, ListChecks } from '@phosphor-icons/react'

// 标准用法
<ClipboardText size={20} color="var(--comp-brief)" weight="regular" />

// 激活/强调状态用 bold weight
<ClipboardText size={20} color="var(--comp-brief)" weight="bold" />
```

本项目同时在 `/icons/regular/` 和 `/icons/bold/` 目录下保存了 SVG 原文件备用。

### 11.2 图标尺寸规范

| 使用场景 | 尺寸 | weight |
|---------|------|--------|
| 文件夹侧边栏 | 16px | regular |
| 按钮内图标 | 18px | regular |
| 卡片标题图标 | 20px | regular/bold（激活）|
| Tab 图标 | 20px | bold（激活）/ regular（非激活）|
| TopBar 图标 | 18px | regular |
| 工位卡片图标 | 24px | bold |
| 大型 CTA 按钮图标 | 22px | bold |
| 揭幕/庆祝图标 | 40px | bold |
| 模态标题图标 | 32px | bold |

### 11.3 图标颜色规范

- 跟随文字颜色（`currentColor`）：大多数场景，继承父元素 `color`
- 组件专属色：文件夹侧边栏图标用 `var(--comp-xxx)` 对应组件色
- 白色图标：深色背景按钮上，用 `#FFFDF7`
- 状态色图标：success/warning/error 场景用对应状态色

### 11.4 完整图标映射表

#### 九大游戏组件图标

| 组件 | 图标名（@phosphor-icons/react） | 文件（/icons/regular/） |
|------|-------------------------------|------------------------|
| 📋 委托单 | `ClipboardText` | `clipboard-text.svg` |
| 🎨 装修方案 | `Palette` | `palette.svg` |
| 📝 需求清单 | `ListChecks` | `list-checks.svg` |
| 🤖 工匠团队 | `UsersThree` | `users-three.svg` |
| 🎒 技能包 | `Backpack` | `backpack.svg` |
| 📜 规则系统 | `Scales` | `scales.svg` |
| 🔀 流程控制 | `GitFork` | `git-fork.svg` |
| 🔌 Plug | `Plug` | `plug.svg` |
| 📚 图书馆 | `Books` | `books.svg` |

#### 页面导航 & 功能图标

| 用途 | 图标名 | 文件 |
|------|--------|------|
| 小镇地图 | `MapTrifold` | `map-trifold.svg` |
| 建筑/房子 | `House` | `house.svg` |
| 建筑群/小镇 | `Buildings` | `buildings.svg` |
| 工地/建造 | `Hammer` | `hammer.svg` |
| 关卡星星 | `Star` | `star.svg` |
| 锁定 | `Lock` | `lock.svg` |
| 解锁 | `LockOpen` | `lock-open.svg` |
| API Key | `Key` | `key.svg` |
| 分享 | `ShareNetwork` | `share-network.svg` |
| 用户头像 | `User` | `user.svg` |
| 登录 | `SignIn` | `sign-in.svg` |

#### 状态 & 反馈图标

| 用途 | 图标名 | 文件 |
|------|--------|------|
| 完成 ✓ | `CheckCircle` | `check-circle.svg` |
| 失败 ✗ | `XCircle` | `x-circle.svg` |
| 警告 | `WarningCircle` | `warning-circle.svg` |
| 信息 | `Info` | `info.svg` |
| 关闭/删除 | `X` | `x.svg` |
| 加载中 | `CircleNotch` | `circle-notch.svg` |（旋转动画）
| 成功勾 | `CheckFat` | `check-fat.svg` |
| 进行中 | `Lightning` | `lightning.svg` |

#### 操作 & 工具图标

| 用途 | 图标名 | 文件 |
|------|--------|------|
| 添加 | `Plus` | `plus.svg` |
| 编辑 | `PencilSimple` | `pencil-simple.svg` |
| 删除 | `Trash` | `trash.svg` |
| 搜索 | `MagnifyingGlass` | `magnifying-glass.svg` |
| 发送/开始 | `PaperPlaneTilt` | `paper-plane-tilt.svg` |
| 开始播放 | `Play` | `play.svg` |
| 上传 | `UploadSimple` | `upload-simple.svg` |
| 文件 | `FileText` | `file-text.svg` |
| 复制 | `Copy` | `copy.svg` |
| 向右导航 | `ArrowRight` | `arrow-right.svg` |
| 向左返回 | `ArrowLeft` | `arrow-left.svg` |
| 外链 | `ArrowUpRight` | `arrow-up-right.svg` |
| 链接 | `LinkSimple` | `link-simple.svg` |
| 设置 | `Gear` | `gear.svg` |
| 更多 | `DotsThree` | `dots-three.svg` |
| 筛选 | `Funnel` | `funnel.svg` |
| 重试/迭代 | `ArrowsClockwise` | `arrows-clockwise.svg` |
| 时间/进度 | `Clock` | `clock.svg` |

#### 游戏特效图标

| 用途 | 图标名 | 文件 |
|------|--------|------|
| Teaching Moment 💡 | `Lightbulb` | `lightbulb.svg` |
| Mirror 思考气泡 | `ChatCircleText` | `chat-circle-text.svg` |
| AI / Agent | `Robot` | `robot.svg` |
| 魔法连接 | `MagicWand` | `magic-wand.svg` |
| 图片素材 Plug | `Image` | `image.svg` |
| 地图 Plug | `MapPin` | `map-pin.svg` |
| 揭幕庆祝 | `Confetti` | `confetti.svg` |
| 闪光/新功能 | `Sparkle` | `sparkle.svg` |
| 完成目标 | `FlagCheckered` | `flag-checkered.svg` |
| Token/代币 | `Coin` | `coin.svg` |

---

## 12. CSS 设计令牌（完整变量表）

将以下内容放入 `src/styles/tokens.css`（或 Tailwind 的 `theme.extend`）：

```css
:root {
  /* === 品牌色 === */
  --color-primary:   #3385FF;
  --color-secondary: #29665B;
  --color-accent:    #E5594F;

  /* === 背景色 === */
  --bg-base:       #F8F2E2;
  --bg-surface:    #FFFDF7;
  --bg-blueprint:  #E8F4FD;
  --bg-overlay:    rgba(34, 34, 34, 0.55);

  /* === 组件色 === */
  --comp-brief:    #3385FF;
  --comp-style:    #C760A8;
  --comp-req:      #4CAF50;
  --comp-agent:    #ED6D57;
  --comp-skill:    #F2C84B;
  --comp-rule:     #29665B;
  --comp-flow:     #9C27B0;
  --comp-plug:     #00BCD4;
  --comp-library:  #795548;

  /* === 语义状态色 === */
  --color-success: #4CAF50;
  --color-warning: #FFC107;
  --color-error:   #F44336;
  --color-active:  #3385FF;
  --color-locked:  #9E9E9E;
  --color-tm:      #9C27B0;

  /* === 中性色 === */
  --text-primary:     #1A1A1A;
  --text-secondary:   #5A5A5A;
  --text-placeholder: #AAAAAA;
  --text-disabled:    #CCCCCC;
  --color-divider:    #E8E2D4;

  /* === 字体 === */
  --font-family: 'OPPOSans', 'OPPO Sans', 'PingFang SC',
                 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

  /* === 字号 === */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-md:   1.125rem;   /* 18px */
  --text-lg:   1.25rem;    /* 20px */
  --text-xl:   1.5rem;     /* 24px */
  --text-2xl:  2rem;       /* 32px */
  --text-3xl:  2.5rem;     /* 40px */

  /* === 间距 === */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* === 圆角 === */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* === 阴影 === */
  --shadow-card-hover:         3px 3px 0px #1A1A1A;
  --shadow-agent-active:       0 0 0 3px #3385FF, 0 0 12px rgba(51,133,255,0.35);
  --shadow-tm:                 0 0 0 3px #9C27B0, 0 0 16px rgba(156,39,176,0.4);
  --shadow-modal:              6px 6px 0px rgba(26,26,26,0.15);

  /* === 缓动 === */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-enter:    cubic-bezier(0, 0, 0.2, 1);
  --ease-exit:     cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === 时长 === */
  --dur-instant:  80ms;
  --dur-fast:     150ms;
  --dur-standard: 250ms;
  --dur-slow:     400ms;
  --dur-story:    600ms;

  /* === 断点（仅供 JS 引用）=== */
  --bp-desktop:    1024px;
  --bp-wide:       1280px;
  --bp-ultrawide:  1440px;

  /* === 布局 === */
  --sidebar-width:      200px;
  --topbar-height:      48px;
  --bottombar-height:   48px;
  --agent-col-ratio:    65%;
  --mirror-col-ratio:   35%;

  /* === 建筑降饱和配色 === */
  --building-l1-roof:  #5A9BD5;
  --building-l1-wall:  #E8946A;
  --building-l2-roof:  #4A9E8F;
  --building-l2-wall:  #F5D76E;
  --building-l3-roof:  #E8946A;
  --building-l3-wall:  #E89FB0;
  --building-l4-roof:  #4A9E8F;
  --building-l4-wall:  #C5DFF5;
  --building-locked:   #C5C5C5;
}
```

### Tailwind 4 集成（tailwind.config 参考）

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary:   'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent:    'var(--color-accent)',
        surface:   'var(--bg-surface)',
        base:      'var(--bg-base)',
        blueprint: 'var(--bg-blueprint)',
        // 九大组件色
        'comp-brief':   'var(--comp-brief)',
        'comp-style':   'var(--comp-style)',
        'comp-req':     'var(--comp-req)',
        'comp-agent':   'var(--comp-agent)',
        'comp-skill':   'var(--comp-skill)',
        'comp-rule':    'var(--comp-rule)',
        'comp-flow':    'var(--comp-flow)',
        'comp-plug':    'var(--comp-plug)',
        'comp-library': 'var(--comp-library)',
      },
      fontFamily: {
        sans: ['OPPOSans', 'OPPO Sans', 'PingFang SC', 'Hiragino Sans GB',
               'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
      },
      boxShadow: {
        'card-hover': 'var(--shadow-card-hover)',
        'agent':      'var(--shadow-agent-active)',
        'tm':         'var(--shadow-tm)',
        'modal':      'var(--shadow-modal)',
      },
      transitionTimingFunction: {
        'standard': 'var(--ease-standard)',
        'enter':    'var(--ease-enter)',
        'bounce-soft': 'var(--ease-bounce)',
      },
    },
  },
}
```

---

## 附录 A：页面速查

### 登录页

```
背景: --bg-base (#F8F2E2)
中央卡片:
  background: --bg-surface
  border-radius: --radius-xl
  padding: 40px
  width: min(440px, calc(100vw - 32px))
  shadow: --shadow-modal

Logo: --text-2xl Heavy --color-primary 居中
副标题: --text-sm --text-secondary 居中 "建设你的小镇，学会 Vibe Code"
表单间距: gap --space-6
输入框: 全宽，手机号/邮箱 + 验证码
登录按钮: Primary 大按钮 全宽 "进入小镇"
注册链接: --text-sm Ghost 按钮 "没有账号？注册"
```

### BYOK 建筑许可证弹窗

```
触发: 首次点击建筑（任意状态非锁定建筑）
Modal 样式: 标准 Modal（见8.12）
标题左侧: Key 图标 32px --color-primary
标题: "建筑许可证"  --text-xl Bold
副标题: "CodeTown 使用 Opencode API，请粘贴你的专属密钥"  --text-sm --text-secondary
输入框: 全宽，type="password"，placeholder="sk-..."
说明文字: "密钥只在当前页面会话中使用，刷新后需重新输入"  --text-xs --text-placeholder
帮助链接: "如何申请 Opencode API Key？↗"  --text-xs --color-primary
确认按钮: Primary 大按钮 "🔑 开工！"
费用提示: "L1 面包店预计消耗约 ¥0.2"  --text-xs --text-secondary 居中 按钮下方
```

### 揭幕后分享页

```
分享地址格式: codetown.app/p/{slug}
小镇地址格式: codetown.app/u/{username}

分享卡片:
  背景: --bg-surface
  圆角: --radius-xl
  内边距: 24px
  内容: 项目名 + 关卡标识 + 建造者名 + 建筑插画缩略图
  底部: [复制链接] [在新标签打开]
```

---

## 附录 B：禁止清单（AI 请牢记）

| ❌ 禁止 | ✅ 应该 |
|--------|--------|
| `#FFFFFF` 纯白 | `#FFFDF7` 象牙白 |
| `#000000` 纯黑 | `#1A1A1A` 深黑 |
| 任何模糊阴影 `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` | 纯色偏移 `3px 3px 0px #1A1A1A` 或无阴影 |
| Emoji 作为功能性图标 | Phosphor Icons SVG 组件 |
| 随机颜色（不在本文档中的 hex） | 只从本文档色彩系统选取 |
| `border-radius: 5px` / `7px` / `11px` 等非标准值 | 只用 `--radius-*` 令牌 |
| `font-size: 13px` / `15px` / `17px` 等非标准值 | 只用 `--text-*` 令牌 |
| 英文 UI 文案 | 全部中文 |
| 渐变背景色（除木纹/网格纹理外）| 纯色填充 |
| `z-index` 任意值 | 见层级系统：Toast 200 / Modal 150 / TopBar 100 / Sidebar 50 / Overlay 140 |

---

*CodeTown FRONTEND_GUIDELINES.md v1.0 — 最后更新 2026-03-14*
*与 PRD v6.5 同步*
