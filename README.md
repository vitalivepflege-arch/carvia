# Carvia

Carvia is the working codename for a premium B2B automotive SaaS platform that helps professional car dealers evaluate purchase opportunities faster and more safely.

## Product Focus

The MVP starts with `Carvia Intelligence`: a deal-evaluation workflow that answers one core question:

> Is this vehicle worth buying for my dealership?

The platform combines normalized vehicle data, comparable listings, estimated market pricing, total landed cost, projected gross margin, and confidence-aware scoring. Every value is presented as a data-backed estimate, not a guaranteed outcome.

## Monorepo Layout

- `apps/web` - Next.js application shell and MVP UI
- `packages/ui` - shared UI primitives and design tokens
- `packages/config` - shared TypeScript and ESLint configuration
- `packages/domain` - canonical schemas and analysis contracts
- `packages/providers` - provider interfaces and mock/manual provider boundaries
- `packages/database` - Prisma schema and database helpers
- `docs` - architecture, gap analysis, roadmap, and compliance notes

## Tech Baseline

- Next.js 16
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Prisma 7
- Zod 4
- Auth.js-ready application boundaries
- PostgreSQL and optional Redis via Docker Compose

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment values:

   ```bash
   cp .env.example .env
   ```

3. Start local infrastructure:

   ```bash
   docker compose up -d
   ```

   The bundled local PostgreSQL service is exposed on port `5433` to avoid collisions with an already running host Postgres instance.

4. Generate Prisma client and apply the initial schema:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. Start the app:

   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm dev` - run the web app locally
- `pnpm build` - build every workspace package
- `pnpm lint` - run ESLint across the workspace
- `pnpm typecheck` - run TypeScript checks across the workspace
- `pnpm test` - run placeholder package tests
- `pnpm db:generate` - generate Prisma client
- `pnpm db:push` - push schema to the configured database

## Provider Policy

Carvia does not scrape protected websites, bypass anti-bot systems, or present synthetic data as live market data. External providers must be integrated through explicit adapters and can remain disabled when credentials are unavailable.

## Marketplace Search

Carvia now ships a normal vehicle-search flow under `/market-search`.

- If official `mobile.de` Search API credentials are configured, Carvia can query `mobile.de` live.
- If official `AutoScout24` Developer API credentials are configured, Carvia can also query `AutoScout24` live.
- If those credentials are missing, Carvia automatically falls back to local mock inventory so the normal search flow still works during development.

Environment variables for the live marketplace adapters live in `.env.example`.

## Live Provider Setup

Recommended order for live marketplace rollout:

1. `AutoScout24` first
2. `mobile.de` second

Current practical state as of August 10, 2026:

- Carvia already supports both official adapters in code.
- The local vehicle search works without external APIs by using the built-in local inventory and image placeholders.
- `AutoScout24` needs official `CLIENT_ID` and `CLIENT_SECRET`.
- `mobile.de` needs official Search API activation plus valid API username/password.

Required environment values:

```env
AUTOSCOUT_API_ENABLED=true
AUTOSCOUT_API_BASE_URL=https://api.autoscout24.ch
AUTOSCOUT_API_AUDIENCE=https://api.autoscout24.ch
AUTOSCOUT_API_CLIENT_ID=...
AUTOSCOUT_API_CLIENT_SECRET=...

MOBILE_API_ENABLED=true
MOBILE_API_BASE_URL=https://services.mobile.de
MOBILE_API_USERNAME=...
MOBILE_API_PASSWORD=...
```

Until those credentials are available, Carvia should continue operating in local-inventory mode rather than scraping protected third-party marketplaces.

## Current MVP State

This repository currently contains the production-oriented foundation for:

- app shell and premium dashboard baseline
- canonical vehicle and analysis contracts
- provider abstraction boundaries
- multi-tenant-ready data model foundation
- local-first development with mock/manual provider support
- credentials-based Auth.js phase-1 authentication
- company onboarding and tenant-aware dashboard access

See [docs/architecture.md](docs/architecture.md), [docs/roadmap.md](docs/roadmap.md), and [docs/provider-compliance.md](docs/provider-compliance.md) for implementation details.
