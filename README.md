# fotocopy-platform

Universal multi-tenant platform for photocopy, printing, and document service businesses.

## Overview
This repository now includes the first two implementation stages:

- Phase 1: project setup, monorepo foundation, and initial platform architecture
- Phase 2: store setup, service catalog, and pricing configuration

## Current status
The platform includes:
- React + TypeScript frontend starter
- Express + TypeScript API backend
- Local print-agent shell
- Prisma schema foundation for multi-tenant data
- Store onboarding workflow
- Service management and pricing endpoints

## Key business principles implemented
- multi-tenant store architecture
- store-level data separation
- easy onboarding for owners without technical knowledge
- payment-first business flow remains as the central long-term design

## Quick start

1. Install dependencies:
   npm install

2. Copy environment file:
   cp .env.example .env

3. Start the API:
   npm run dev:api

4. Start the frontend:
   npm run dev:web

5. Open the app in browser:
   http://localhost:5173

## Notes
- This project is intentionally implemented incrementally and safely.
- The API currently uses in-memory mock data for rapid Phase 1/2 development.
- A PostgreSQL-backed Prisma layer is already scaffolded and ready for later migration to persistent storage.

## Roadmap
1. Phase 1: project setup
2. Phase 2: store setup
3. Phase 3: customer ordering
4. Phase 4: payment flow
5. Phase 5: operator dashboard
6. Phase 6: print system
7. Phase 7: tracking and notifications
8. Phase 8: finance
9. Phase 9: inventory
10. Phase 10: analytics
11. Phase 11: security hardening
12. Phase 12: testing
13. Phase 13: deployment
