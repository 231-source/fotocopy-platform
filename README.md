# fotocopy-platform

Universal multi-tenant platform for photocopy, printing, and document service businesses.

## Overview
This repository contains the initial foundation for a platform that supports:
- multi-tenant store management
- customer ordering
- payment-first order flow
- operator dashboard
- local print agent integration
- secure private file handling

## Current Phase
Phase 1: project setup, database foundation, multi-tenant architecture, authentication, roles, and initial store registration structure.

## Monorepo structure
- apps/web: customer and operator frontend
- apps/api: backend REST API
- apps/print-agent: local print agent
- packages/database: Prisma schema and migrations
- packages/types: shared DTOs and domain types
- packages/ui: reusable UI primitives
- packages/config: environment and shared config
- packages/validation: validation helpers

## Quick start

1. Install dependencies:
   npm install

2. Copy environment file:
   cp .env.example .env

3. Start development services:
   npm run dev:api
   npm run dev:web
   npm run dev:agent

## Notes
- This scaffold is intentionally minimal and safe for incremental development.
- Phase 1 focuses on the foundation to be extended in later phases.
- Database and auth are prepared for practical multi-tenant expansion.

## Planned phases
1. Project setup
2. Store setup
3. Customer ordering
4. Payment flow
5. Operator dashboard
6. Print system
7. Customer tracking
8. Finance
9. Inventory
10. Analytics
11. Security
12. Testing
13. Deployment
