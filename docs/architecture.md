# Architecture Overview

## Goal

Carvia starts as a modular B2B automotive intelligence platform with one immediate focus: evaluating vehicle purchase opportunities for dealers without depending on live third-party credentials.

## System Shape

- `apps/web` owns the product surface and orchestration layer.
- `packages/domain` owns canonical schemas and analysis contracts.
- `packages/providers` owns every external and mock provider boundary.
- `packages/database` owns persistent multi-tenant data structures.
- `packages/ui` owns shared presentation primitives.

## Key Architectural Decisions

- Monorepo from day one to avoid later extraction churn.
- Provider-first integration layer so live sources remain optional.
- Domain services stay outside the UI to keep pricing and scoring logic portable.
- Multi-tenancy is modeled at the database boundary from the beginning.
- Mock/manual import support is treated as a first-class local-development path.

## Immediate Boundaries

- Authentication is prepared at the app boundary but not implemented yet.
- Analytics services are represented as contracts, not finished algorithms.
- Tenant-safe company ownership is modeled in Prisma but not yet enforced in app queries.
- Historical listing snapshots are part of the schema foundation for later liquidity and demand modeling.

