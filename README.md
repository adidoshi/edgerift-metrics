# EdgeRift Metrics

EdgeRift Metrics is a full-stack trading journal and performance analytics app built for traders who want to log executions, review historical performance, and generate AI-assisted coaching summaries from real trading data.

The repository is organized as a Turborepo monorepo with a React frontend, an Express API, and shared workspace packages for contracts, UI primitives, and TypeScript configuration.

## What The App Does

EdgeRift Metrics helps traders move from raw trade logging to structured performance review.

- Creates and manages trader accounts with authentication.
- Stores journals and trade history tied to the signed-in user.
- Tracks trade details such as pair, direction, R multiple, PnL, strategy, session, tags, and rule adherence.
- Supports chart image uploads for trade review.
- Calculates portfolio and trading performance metrics.
- Generates AI mentor-style reports for weekly or monthly performance reviews.
- Lets users maintain account settings such as starting balance for analytics calculations.

## Feature Highlights

- Authentication: Email/password registration and login with JWT-based protected API routes.
- Trade journaling: Structured trade entry with validation, normalization, comments, tags, rules followed, and optional chart screenshots.
- Trading history: Filterable and deletable trade records for reviewing past executions.
- Performance analytics: Overview metrics such as total trades, total PnL, win/loss counts, win rate, symbol-level performance, and balance-oriented views.
- AI insights: Generates a coaching report from recent trade history with summary, key drivers, what went well, what went wrong, behavior signals, recommendations, and next steps.
- Account settings: Saves the starting balance used to contextualize returns and balance tracking.
- Shared validation contracts: Frontend and backend both consume the same Zod schemas for safer request and response handling.

## Main Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Zustand
- Tailwind CSS 4
- Radix UI
- Recharts
- React Hook Form
- Sonner

### Backend

- Node.js
- Express 5
- TypeScript
- Mongoose
- MongoDB Atlas
- JWT
- bcryptjs
- Multer
- Cloudinary
- OpenAI SDK
- Zod

### Monorepo And Tooling

- pnpm workspaces
- Turborepo
- Shared TypeScript config package
- Shared contracts package
- Shared UI package

## Architecture Summary

### Frontend Implementation

The web app lives in `apps/web` and is built with React, Vite, and TanStack Router. The UI is organized around authenticated pages for Journal, Trading History, Analytics, and AI Insights. TanStack Query handles server-state fetching and cache invalidation for trades, account settings, and AI report workflows, while Zustand persists the signed-in session locally so route guards and API calls can reuse the auth state without prop drilling.

### Backend Implementation

The API lives in `apps/api` and exposes route modules for authentication, journals, trades, analytics, and account settings. Express handles routing and middleware, Mongoose manages persistence, Zod validates request payloads through shared contracts, Multer and Cloudinary support trade image uploads, and OpenAI powers mentor-style performance reports. The API is built as a Node ESM service and outputs compiled runtime files to `dist`.

### Shared Workspace Packages

- `packages/contracts`: Shared Zod schemas and inferred TypeScript types used across frontend and backend.
- `packages/ui`: Shared UI primitives and helper utilities for reusable presentation components.
- `packages/config`: Shared TypeScript configuration presets for Node and React packages.

## Monorepo Setup

This project uses a pnpm workspace plus Turborepo to keep related applications and packages in one repository.

### Workspace Layout

```text
apps/
	api/        Express + MongoDB API
	web/        React + Vite frontend
packages/
	config/     Shared TypeScript config
	contracts/  Shared Zod schemas and types
	ui/         Shared UI package
```

### Why Turborepo Helps Here

- It understands dependency relationships between apps and packages.
- Shared packages can be built before dependent apps automatically.
- Build, lint, typecheck, and test commands stay consistent across the workspace.
- Caching reduces repeated work during development and CI.
- The app can share contracts and UI code without copy-pasting logic between frontend and backend.

In this app specifically, Turborepo is useful because the API and frontend both depend on the shared contracts package, and the frontend also consumes shared UI components. That keeps business rules and design primitives centralized instead of duplicated.

## How TanStack Query And Zustand Helped

### TanStack Query

TanStack Query manages server state across the frontend.

- Fetches trades, analytics inputs, and account settings.
- Handles mutations for login-related flows, trade creation, trade deletion, account updates, and AI report generation.
- Keeps cached data in sync through invalidation and query updates after mutations.
- Reduces manual loading and error-state plumbing for API-driven screens.

This is especially useful in Analytics, Journal, Trading History, and AI Insights, where multiple views depend on the same trade data and need consistent refresh behavior after writes.

### Zustand

Zustand manages lightweight client-side session state.

- Stores the authenticated user and JWT token.
- Persists auth state to local storage.
- Keeps route guards simple.
- Avoids pushing auth context through multiple component layers.

This is a good fit here because auth state is small, global, and needs to survive refreshes without adding a heavier state-management layer.

## Build Architecture

### Root Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
```

### App Build Outputs

- `apps/web` builds a static Vite bundle.
- `apps/api` builds a compiled Node service in `dist`.
- `packages/contracts` and `packages/ui` build shared artifacts consumed by the apps.

### Build Flow Summary

- Frontend depends on shared contracts and shared UI.
- Backend depends on shared contracts.
- Turborepo coordinates package build order across these dependencies.

## Short Implementation Summary

EdgeRift Metrics is a trading performance platform that combines structured journaling, analytics, and AI-assisted review in one system. The frontend focuses on a responsive data-driven trader experience, while the backend provides authenticated APIs, validation, persistence, media handling, and AI report generation. The monorepo setup makes shared schemas, UI primitives, and build tooling reusable across the stack, which improves consistency, maintainability, and deployment clarity.
