# ContractLens

ContractLens turns business agreements into source-backed obligations, deadlines, review items, and version-aware action plans.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/contractlens run dev` — run the web app locally
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Windows shortcut: `start.bat`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/contractlens` — React/Vite application
- `artifacts/api-server` — Express API and seeded demo orchestration
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema` — Drizzle schema for contract operations data
- `start.bat` — Windows local launcher

## Architecture decisions

- The frontend uses generated React Query hooks from the OpenAPI contract rather than hand-written request types.
- The demo uses deterministic fictional Acme/Northstar data so the 3-minute workflow works without an external AI provider.
- The API keeps the agent stages visible in `agent_actions`; the persistence boundary is isolated so the in-memory demo store can move to the Drizzle schema without changing the UI contract.
- Source evidence is attached to extracted facts, obligations, review findings, and grounded assistant answers.

## Product

- Dashboard with active agreements, deadlines, renewals, review queue, and recent agent activity.
- Contract dossier with facts, parties, obligations, timeline, evidence, grounded assistant, and version comparison.
- Cross-contract obligations and deadline view.
- Human review queue with resolve/ignore actions.

## User preferences

- Keep the product distinct from the previous travel project.

## Gotchas

- Run OpenAPI codegen after changing `lib/api-spec/openapi.yaml`.
- The Vite app needs both `PORT` and `BASE_PATH`.
- The Windows launcher starts two command windows and expects pnpm to be on PATH.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
