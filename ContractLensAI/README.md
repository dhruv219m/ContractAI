# ContractLens

**From contracts to actions.**

ContractLens is an agentic contract operations MVP. It turns agreements into source-backed facts, obligations, deadlines, review items, and downstream action updates when a new version changes the contract.

## Run locally

### Replit / Linux

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

In a second terminal:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/contractlens run dev
```

Open the web preview at the URL provided by the workspace.

### Windows

Double-click `start.bat` from the repository root. It opens:

- API server: `http://localhost:5000`
- Web app: `http://localhost:5173`

The Windows script starts the API and frontend in separate command windows and configures the frontend proxy for `/api`.

## Environment variables

The demo workflow does not require an AI provider key. The backend uses a deterministic demo analysis so the full product flow works without external services.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes per service | Port for the API or Vite server |
| `BASE_PATH` | Yes for Vite | Artifact route prefix; use `/` for a local standalone run |
| `DATABASE_URL` | For schema operations | PostgreSQL connection used by Drizzle schema tooling |

The current MVP keeps the live demo state in the API process so it starts immediately and remains deterministic. The modular Drizzle schema is included for the next persistence step and already contains tables for contracts, versions, parties, obligations, deadlines, review items, agent actions, chat messages, and source evidence.

## Architecture

- `artifacts/contractlens` — React + Vite frontend with dashboard, contracts, obligations, review queue, activity feed, and contract detail views.
- `artifacts/api-server` — Express API with the orchestrated demo pipeline and seeded contract data.
- `lib/api-spec/openapi.yaml` — source of truth for the API contract.
- `lib/api-client-react` — generated React Query hooks.
- `lib/api-zod` — generated request/response validation schemas.
- `lib/db` — Drizzle/PostgreSQL schema for modular persistence.

## Agent workflow

1. `OrchestratorAgent` coordinates analysis and records state.
2. `DocumentAgent` extracts parties, terms, dates, and source evidence.
3. `ObligationAgent` converts contract language into owner/action/deadline records.
4. `ReviewAgent` flags ambiguity and missing precision without making legal determinations.
5. `ActionAgent` organizes obligations into an operational plan.
6. `ChangeDetectionAgent` compares versions, categorizes material changes, identifies affected obligations, and describes downstream impact.

The UI makes these steps visible through the activity feed, evidence references, review queue, and version comparison panel.

## Three-minute demo

1. Open the dashboard and point out active agreements, obligations, review items, and renewals.
2. Open **Contracts** and upload any filename ending in `.pdf`; the seeded demo analyzer supplies the fictional Acme/Northstar agreement.
3. Open the agreement to show extracted facts, parties, obligations, deadline timeline, and source evidence.
4. Ask the grounded assistant: **“What do I need to do before this contract renews?”**
5. Open **Review queue** to show the ambiguity warning and resolve or ignore it.
6. In **Change comparison**, click **Compare versions** to show the fee increase, renewal notice change, affected obligations, and human-review flag.
7. Finish on **Agent activity** to show the coordinated processing trail.

ContractLens is a demonstration product and does not provide legal advice or a legally binding interpretation.