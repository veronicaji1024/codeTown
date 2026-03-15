# AGENTS.md

## Purpose
This file guides coding agents working in this repository.

This repo is currently **spec-driven**: it contains product, frontend, backend, flow, and implementation docs, but not the actual monorepo implementation yet. Treat documented commands and conventions as the intended target unless the referenced files actually exist.

## Source-of-truth documents
- `TECH_STACK_v1_0_revised.md` — runtime, workspaces, scripts, lint/format config
- `FRONTEND_GUIDELINES_v1_0_revised.md` — visual/design source of truth
- `BACKEND_STRUCTURE_v1_0_revised.md` — backend/API/storage/auth source of truth
- `APP_FLOW_v1_2_revised.md` — navigation, screen states, and routing behavior
- `IMPLEMENTATION_PLAN_v1_0_revised.md` — scaffolding order and example file snippets
If docs conflict, prefer:
1. Frontend visuals: `FRONTEND_GUIDELINES_v1_0_revised.md`
2. Backend/API/data: `BACKEND_STRUCTURE_v1_0_revised.md`
3. Tooling/runtime/packages: `TECH_STACK_v1_0_revised.md`
4. App flow/routing: `APP_FLOW_v1_2_revised.md`
5. Build sequence/examples: `IMPLEMENTATION_PLAN_v1_0_revised.md`

Do not invent behavior outside these docs unless the user asks.

## Current repository reality
- No root `package.json` currently exists in this snapshot.
- No `client/`, `server/`, or `shared/` implementation directories currently exist.
- No test framework config exists yet.
- No root `AGENTS.md` existed before this file.
- No Cursor rules were found in `.cursor/rules/` or `.cursorrules`.
- No Copilot rules were found in `.github/copilot-instructions.md`.

If code is later scaffolded, update this file to match reality.

## Planned runtime and workspace setup
- Node.js: `22.14.0`
- npm: `10.9.2`
- TypeScript: `5.7.3`
- Workspaces: `client`, `server`, `shared`
Planned root config:
- `.nvmrc` → `22.14.0`
- `.npmrc` → `save-exact=true` and `engine-strict=true`
Dependency policy:
- Pin exact versions only.
- Never use `^`, `~`, `*`, or `latest`.
- Preferred install form: `npm install --save-exact <pkg>@<version> -w <workspace>`
- Commit `package-lock.json` once the real monorepo exists.
- Prefer `npm ci` in CI once a lockfile exists.

## Planned commands
These are documented in the specs but are **not currently runnable in this repo snapshot**.
### Root
- `npm run dev` — planned concurrent client/server dev
- `npm run build` — planned build order: `shared` → `client` → `server`
- `npm run lint` — planned lint for `client` and `server`
### Client
- `npm run dev -w client` — Vite dev server on port `5173`
- `npm run build -w client` — `tsc -p tsconfig.app.json && vite build`
- `npm run preview -w client` — preview build
- `npm run lint -w client` — `eslint src --ext ts,tsx`
### Server
- `npm run dev -w server` — `tsx watch src/index.ts`
- `npm run build -w server` — `tsup src/index.ts --format cjs --dts --out-dir dist`
- `npm run start -w server` — `node dist/index.js`
### Shared
- `npm run build -w shared` — referenced by the root build pipeline
### Tests
Current state:
- No documented `test` script in package manifests
- No Jest/Vitest/Playwright/Cypress config in this repo snapshot
- No supported single-test command yet
Single-test guidance:
- There is currently **no single-test workflow** to run.
- If a test runner is added later, update this file with:
  - full suite command
  - single-file command
  - single-test-name command

## Formatting rules
Planned Prettier config:
- `semi: false`
- `singleQuote: true`
- `tabWidth: 2`
- `trailingComma: 'es5'`
- `printWidth: 100`
General expectations:
- Use 2-space indentation.
- Prefer single quotes.
- Omit semicolons.
- Remove extra blank lines and duplicate CSS.
- Remove unused variables.
- Remove debug `console.log` statements before finishing.

## TypeScript rules
- Use TypeScript across `client`, `server`, and `shared`.
- Keep TS version aligned across workspaces.
- Use strict mode.
- Respect `noUnusedLocals` and `noUnusedParameters`.
- Prefer shared types in `shared/` for client/server contracts.
- Planned path aliases:
  - `@/*` → `client/src/*`
  - `@codetown/shared` → shared types

Do not weaken typing just to make code compile.

## Import rules
- Put required side-effect imports first.
  - Example: `import 'dotenv/config'` must be line 1 in the server entry.
- Then external packages.
- Then Node built-ins using the `node:` protocol.
- Then local modules.
- In React 19 files, do **not** add `import React from 'react'` unless needed.

Library-specific rules:
- Use `@phosphor-icons/react` for business/UI icons.
- Do **not** use `lucide-react` in business code; it is only kept for shadcn-generated internals.
- Use `wouter` for share/public route parsing; do not introduce `react-router-dom`.

## Naming rules
Follow documented examples:
- React components: `PascalCase` (`App.tsx`, `SharePage`, `TownPublicPage`)
- Service/class modules: `PascalCase` (`Orchestrator`, `MagicConnector`, `MirrorService`)
- Hooks/util/store files: `camelCase` (`buildStore.ts`, `websocket.ts`, `utils.ts`)
- Types/interfaces: `PascalCase`
- Variables/functions: clear English or Chinese pinyin names are acceptable
- UI copy: Chinese only unless a human explicitly approves an exception

Be consistent within a folder; do not mix naming styles arbitrarily.

## Frontend implementation rules
- `FRONTEND_GUIDELINES_v1_0_revised.md` is the visual source of truth.
- Use CSS variables/tokens from the design docs.
- Tailwind is v4 and CSS-first:
  - use `@import "tailwindcss"`
  - keep theme tokens in CSS
  - do not add `tailwind.config.js` unless project direction changes
- Use only fixed radius tokens: `4/8/12/16/24/full`.
- Use the documented spacing scale; all spacing should be multiples of 4px, preferably 8px.
- Follow the documented color palette; do not casually invent new hex values.
- Use OPPOSans as the primary UI font when the assets exist.
- Business UI should remain all-Chinese.
- Keep shadows minimal; the design language is intentionally flat.

## Backend implementation rules
- Frontend must not connect directly to Supabase.
- All data access goes through the Express backend.
- Use Express 5 async/await patterns.
- API errors should use structured payloads like `{ error, message }`.
- Machine-readable `error` codes should be stable and explicit.
- User-facing messages should be Chinese.
- BYOK API keys must never be stored in plaintext.
- BYOK API keys must never be logged.
- Read BYOK keys from `X-API-Key` headers only, then discard after use.

## Error handling and comments
- Do not swallow errors silently.
- Prefer explicit failures over hidden fallbacks.
- Return appropriate backend HTTP status codes.
- Add concise Chinese comments for:
  - each HTML block
  - important CSS classes
  - JavaScript/TypeScript functions
  - complex logic branches

## Routing and app flow
- Treat the app as an SPA.
- Internal navigation should follow `APP_FLOW_v1_2_revised.md`.
- Share/public routes are handled via `wouter`.
- Do not invent extra screens, route states, or shortcuts without updating the flow doc.

## Agent workflow guidance
- This repo is document-heavy; read the relevant spec before writing code.
- For frontend work, read `FRONTEND_GUIDELINES_v1_0_revised.md` first.
- For backend work, read `BACKEND_STRUCTURE_v1_0_revised.md` first.
- For navigation/state-flow work, read `APP_FLOW_v1_2_revised.md` first.
- If implementation diverges from docs, update both code and the relevant spec.

## Missing tool-specific rules
At the time this file was created, these rule files were absent:
- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

If any are added later, merge their instructions into this file and follow the more specific rule for that tool.
