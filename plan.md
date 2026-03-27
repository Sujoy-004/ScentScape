## Plan: End-to-End Connectivity Hardening

### Status Snapshot (2026-03-26)
- Sequence in progress: `1 -> 2 -> 4 -> 3 -> 5`.
- Step 1 complete: backend M6 validation subset is green (`13 passed`).
- Step 2 complete: deployment preflight executed; environment readiness blockers identified (`2/8 healthy` locally, mainly service availability/context and verifier DSN parsing constraints).
- Step 4 complete: evidence documented in `runbook.md`.
- Next active step: Step 3 (replace/upgrade recommendation stubs to real flow).

Stabilize and wire the full local stack (frontend, backend, database services, ML pipeline) using a strict GSD+RALPH loop: validate infrastructure first, then wire API consumption, then verify data and workflow flows end-to-end with repeatable checks.

**Steps**
1. Phase 1: Environment Baseline and Tooling Gate
2. Confirm local prerequisites: Docker Desktop/Engine available in PATH, Node/npm available, Python virtualenv consistent (single env per service), required ports free (3000, 5432, 6379, 7474, 7687, 8000).
3. Normalize local environment files from templates and ensure values align across backend/ml/frontend (`DATABASE_URL`, `NEO4J_*`, `REDIS_URL`, `NEXT_PUBLIC_API_URL`, auth secrets). *blocks Phase 2+*
4. Add a local startup profile/runbook with exact boot order and health checks. *parallel with step 3*
5. Phase 2: Service Boot and Infrastructure Health
6. Start infrastructure services (Postgres, Neo4j, Redis) and verify each health endpoint/CLI ping.
7. Start backend against infra and verify startup logs, DB migration/init path, and health endpoint response.
8. Start frontend and verify it loads with no runtime crash and expected environment URL for backend.
9. Phase 3: Backend Connectivity Corrections
10. Fix async DB driver consistency: ensure backend async engine uses async DSN and no sync fallback leaks; ensure config defaults and env parsing are aligned.
11. Remove duplicated or malformed dependency declarations that break install/build reproducibility (e.g., pyproject duplicate sections).
12. Verify backend API route inventory and health/auth routes are reachable locally. *depends on 7*
13. Phase 4: Frontend-to-Backend Wiring
14. Replace mock-only quiz/recommendation data paths with real API calls via a single API client layer.
15. Add React Query hooks for key flows (fragrance list, recommendation generation/retrieval, profile/history where applicable) with loading/error states.
16. Introduce environment-safe URL strategy (browser-safe public URL + server-side fallback) and remove hardcoded endpoint assumptions.
17. Phase 5: ML Pipeline and Data Plane Integration
18. Verify ML flow configuration reads shared env values and can reach Neo4j/Postgres/Redis where required.
19. Run the weekly refresh pipeline in local-safe mode and verify ingest path writes expected graph/data artifacts.
20. Confirm backend recommendation endpoints consume pipeline-produced data (or graceful fallback with explicit status).
21. Phase 6: End-to-End GSD+RALPH Verification Loop
22. Execute connectivity matrix checks:
23. Frontend -> Backend API (request/response correctness)
24. Backend -> Postgres/Neo4j/Redis (queries + write/read round-trip)
25. ML pipeline -> data stores (ingest success + counts)
26. User flow checks: onboarding quiz -> recommendation generation -> recommendations display -> profile persistence.
27. Log failures, auto-fix non-architectural blockers (GSD Rules 1-3), and rerun matrix until all gates pass.
28. Phase 7: Hardening, Documentation, and Handoff
29. Add troubleshooting docs for common local failures (missing Docker, invalid DB credentials, async driver mismatch, env drift).
30. Add smoke-test scripts/commands for one-command local verification.
31. Produce final integration report: wired/partial/unwired map and residual risks.

**Relevant files**
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/docker-compose.yml` — service topology and dependency health checks.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/.env.example` — canonical shared env keys across services.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/pyproject.toml` — dependency correctness and optional groups.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/app/config.py` — DSN/env defaults and runtime settings.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/app/database.py` — async engine/session behavior.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/app/routers/api.py` — API surface routing.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/app/main.py` — app lifecycle and health wiring.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/frontend/src/components/StandardQuiz.tsx` — current mock path to replace with real fetch flow.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/frontend/src/components/Providers.tsx` — React Query provider baseline.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/frontend/src/app/recommendations/page.tsx` — recommendation consume/render path.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/ml/flows/weekly_refresh.py` — pipeline orchestrator and data ingest flow.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/ml/graph/neo4j_client.py` — graph connectivity primitives.
- `C:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/docs/local-testing-checklist.md` — local testing guardrails to extend.

**Verification**
1. Infra gate: Postgres/Neo4j/Redis all healthy.
2. Backend gate: startup clean, health endpoint success, DB session test passes.
3. Frontend gate: app loads on localhost and performs at least one live API call successfully.
4. API wiring gate: key routes have confirmed consumers (no orphaned critical endpoints).
5. ML gate: weekly refresh runs and writes verifiable data.
6. E2E gate: onboarding -> recommendations -> profile path completes without manual DB edits.
7. Regression gate: frontend build, backend tests/smoke checks pass.

**Decisions**
- Included scope: local development connectivity and integration wiring for frontend/backend/db/ml.
- Excluded scope: production deployment tuning, cloud infra provisioning, large architectural redesign.
- Execution model: GSD auto-fix for non-architectural blockers; pause only for architectural decisions.

**Further Considerations**
1. Database runtime mode for local:
Option A: Dockerized Postgres/Neo4j/Redis as source of truth (recommended).
Option B: Mixed local services/manual installs (faster start, higher drift risk).
2. Frontend data strategy:
Option A: Full live API replacement for all mock paths now (recommended).
Option B: Hybrid mode with feature-flagged mock fallback during transition.
3. Verification automation depth:
Option A: Add scriptable smoke matrix only.
Option B: Add scripted smoke matrix + Playwright API-integrated E2E for critical user flow (recommended).