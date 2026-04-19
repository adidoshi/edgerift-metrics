The WHAT: Your tech stack, project structure, and what each part does. Critical for monorepos—tell the agent what the apps, shared packages, and services are.
The WHY: The purpose of the project and its key components. Help the agent understand intent, not just structure.
The HOW: How to build, test, and verify changes. Include non-obvious tooling (e.g., uv instead of pip, bun instead of npm). Tools mentioned in AGENTS.md get used 160x more often than unmentioned ones (§4.3).

# Tech stack

| Frontend        | Backend    | Deployment |
| --------------- | ---------- | ---------- |
| React 19.2.4    | Node.js    | Vercel     |
| TypeScript      | Express    | Render     |
| Vite            | MongoDB    |            |
| TanStack Router | Mongoose   |            |
| TanStack Query  | Cloudinary |            |
| Zustand         | Zod        |            |
| Tailwind CSS v4 | OpenAI API |            |
| Radix UI        |            |            |
| Recharts        |            |            |
| TanStack Form   |            |            |
| Sonner          |            |            |

## Project structure

```text
apps/
	api/        Express + MongoDB API
	web/        React + Vite frontend
packages/
	config/     Shared TypeScript config
	contracts/  Shared Zod schemas and types
	ui/         Shared UI package
```

## Monorepo And Tooling

- pnpm workspaces
- Turborepo
- `packages/contracts`: Shared Zod schemas and inferred TypeScript types used across frontend and backend.
- `packages/ui`: Shared UI primitives and helper utilities for reusable presentation components.
- `packages/config`: Shared TypeScript configuration presets for Node and React packages.

| As of now only contracts is used accross the app as shared packages

## Purpose of the project

- What is this project? ->
  A trading analytics dashboard featuring interactive charts, and structured journaling.
- Who is it for? -> World wide traders involved in dealing with international financial markets.
- What problem does it solve? -> When it comes to consistency for a retail trader, journaling data, analyzing it & getting on point insights about that becomes more crucial to gain results in the upcoming future, this plaform helps to solve that.

## Key components

### Frontend

The web app lives in `apps/web` and is built with React, Vite, and TanStack Router. The UI is organized around authenticated pages for Journal, Trading History, Analytics, and AI Insights. TanStack Query handles server-state fetching and cache invalidation for trades, account settings, and AI report workflows, while Zustand persists the signed-in session locally so route guards and API calls can reuse the auth state without prop drilling.

### Backend

The API lives in `apps/api` and exposes route modules for authentication, journals, trades, analytics, and account settings. Express handles routing and middleware, Mongoose manages persistence, Zod validates request payloads through shared contracts, Multer and Cloudinary support trade image uploads, and OpenAI powers mentor-style performance reports. The API is built as a Node ESM service and outputs compiled runtime files to `dist`.

## How to build

Build all packages (including shared contracts):

```bash
pnpm --filter @edgerift/contracts build
pnpm --filter @edgerift/api build
pnpm --filter @edgerift/web build
```

Or, to build everything with Turborepo:

```bash
pnpm build
```

## How to install

Install dependencies (all packages):

```bash
pnpm install
```

```bash
pnpm install
pnpm dev
pnpm typecheck
```

## How to start & verify

Typecheck all packages:

```bash
pnpm typecheck
```

Start API (backend) locally:

```bash
pnpm --filter @edgerift/api start
```

Start Web (frontend) locally:

```bash
pnpm --filter @edgerift/web dev
```

## Deployment check

For backend API
Build & install Command

```bash
pnpm install --frozen-lockfile && pnpm --filter @edgerift/contracts build && pnpm --filter @edgerift/api build
```

Start commnad

```bash
pnpm --filter @edgerift/api start
```

For frontend web
Build command

```bash
pnpm turbo run build --filter=@edgerift/web
```

Install command

```bash
pnpm install --frozen-lockfile
```

For detailed instructions:

- See docs/agents/setup.md
- See docs/agents/workflows.md
