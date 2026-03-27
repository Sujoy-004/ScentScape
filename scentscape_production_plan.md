# 🌸 ScentScapeAI — Production-Ready Master Plan

> **Workflow Engine:** CCG (orchestration) + GSD (spec-driven execution) + Ralph Loop (autonomous iteration)
> **UI Design:** Stitch MCP + StringTune animation library
> **Model Routing:** Gemini → Frontend / Codex → Backend / Opus → Planning / Sonnet → Execution

---

## 🧭 Quick Orientation

| Layer | Tech | Status |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, StringTune, Zustand, React Query, D3.js | Scaffolded, needs full implementation |
| Backend | FastAPI, Celery, Redis, PostgreSQL, Neo4j, Pinecone | Partial (routers: auth, fragrances, users) |
| ML Pipeline | Scrapy → clean.py → ingest.py → Neo4j → GraphSAGE → Pinecone | Partial (pipeline and graph exist, models missing) |
| Orchestration | Prefect (weekly_refresh.py) | Partial |
| Infra | Docker Compose, Railway (backend), Vercel (frontend) | Configured, not deployed end-to-end |
| Monitoring | Sentry | Integrated in backend |

---

## ⚙️ Tooling Setup (Do This First — One Time)

### 1. Install CCG Workflow
```bash
npx ccg-workflow
# Choose: Antigravity runtime, global install
```

### 2. Install GSD for Antigravity
```bash
npx get-shit-done-cc --antigravity --global
# Installs to ~/.gemini/antigravity/
```

### 3. Set Up Ralph in the Project
```bash
cd "C:\Users\KIIT0001\Downloads\Telegram Desktop\ScentScapeAI"
mkdir -p scripts/ralph
cp "C:\Users\KIIT0001\Documents\antigravity skills\agents-workflows\ralph\ralph.sh" scripts/ralph/
cp "C:\Users\KIIT0001\Documents\antigravity skills\agents-workflows\ralph\CLAUDE.md" scripts/ralph/
chmod +x scripts/ralph/ralph.sh
```

### 4. Map the Existing Codebase (GSD)
```
/gsd:map-codebase
```
This spawns parallel agents to fully understand the existing stack before planning begins.

### 5. Model Routing Strategy (CCG Fixed Config)
| Task | Model |
|---|---|
| Frontend (UI, CSS, components) | **Gemini** via `/ccg:frontend` |
| Backend (API, DB, logic) | **Codex** via `/ccg:backend` |
| Planning / Architecture | **Opus** via GSD quality profile |
| Execution (bulk coding) | **Sonnet** via GSD balanced profile |
| UI Design Mocks | **Stitch MCP** |
| Animation components | **Gemini** + StringTune tutorials as reference |

---

## 🗺️ The 7 Milestones

```
M1: Foundation & DevEx ────────────────────── Week 1
M2: Full ML Data Pipeline ─────────────────── Week 2
M3: Backend API Completion ────────────────── Week 3
M4: Cinematic Frontend (StringTune UI) ─────── Week 4-5
M5: AI Recommendation Engine ──────────────── Week 6
M6: Integration & E2E Testing ─────────────── Week 7
M7: Production Deployment ──────────────────── Week 8
```

---

## 📦 MILESTONE 1 — Foundation & DevEx
> **Goal:** Clean, working local dev environment. Every piece runs. No errors. CI green.

### GSD Phases:
```
/gsd:new-project  (brownfield — load existing codebase context)
```

**Phase 1.1 — Dev Environment Hardening**
- Docker Compose health-checks for all services (PostgreSQL, Neo4j, Redis)
- `.env.example` fully synced with actual required keys
- `make up` → all services green
- Makefile targets: `make seed`, `make test-backend`, `make test-frontend`, `make logs`

**Phase 1.2 — Backend Foundation Verification**
- FastAPI startup: DB init, Sentry, CORS — all passing
- All 3 routers (auth, fragrances, users) mount successfully
- `/health` endpoint returns 200
- PostgreSQL migrations run cleanly via Alembic

**Phase 1.3 — Frontend Foundation**
- Next.js 14 dev server starts cleanly on port 3000
- Auth middleware (`middleware.ts`) correctly protecting routes
- Environment variables validated at startup

**Phase 1.4 — GSD + Ralph Init**
- `prd.json` created for M1 user stories
- `progress.txt` initialized
- `/ccg:context` initialized (`.context/` directory)
- Git branch strategy: `milestone` mode in GSD config

**Ralph Loop Config:**
```bash
./scripts/ralph/ralph.sh --tool claude 15
```

**Acceptance Criteria:**
- [ ] `make up && make seed` completes in < 2 min
- [ ] Backend tests pass: `pytest backend/tests/`
- [ ] Frontend builds: `cd frontend && npm run build` — no errors
- [ ] `/health` → `{"status": "ok"}`

---

## 🔬 MILESTONE 2 — Full ML Data Pipeline
> **Goal:** 1,000+ real fragrance records in Neo4j. Graph queryable. Data fresh and clean.

**Model:** Codex via `/ccg:backend` for all pipeline work.

### GSD Phases:

**Phase 2.1 — Scrapy Spider Production-Readiness**
```
/ccg:backend "Harden Scrapy spiders in ml/scraper/:
- Add retry middleware, rate limiting, user-agent rotation
- Export to structured JSON: id, name, brand, top_notes, middle_notes, base_notes, accords, year, concentration, gender_label, description
- Target: 1000+ fragrance records
- Output to ml/data/raw/"
```

**Phase 2.2 — Cleaning Pipeline**
```
/ccg:backend "Complete ml/pipeline/clean.py:
- Input: raw JSON from scraper
- Normalize note names (lowercase, deduplicate)
- Validate required fields
- Flag and isolate invalid records
- Output: ml/data/clean/fragrances_clean.json"
```

**Phase 2.3 — Graph Schema + Ingestion**
- Run `ml/graph/schema_init.cypher` against Neo4j
- `FragranceGraphIngestor` tested end-to-end
- Nodes: `Fragrance`, `Brand`, `Note`, `Accord`
- Relationships: `MADE_BY`, `HAS_TOP_NOTE`, `HAS_MIDDLE_NOTE`, `HAS_BASE_NOTE`, `BELONGS_TO_ACCORD`

**Phase 2.4 — Prefect Orchestration**
```
/ccg:backend "Complete ml/flows/weekly_refresh.py:
- Flow: scrape → clean → ingest → verify
- Prefect schedules: every Monday 02:00 UTC
- Alerting: Slack webhook on failure
- Idempotent: re-runs don't duplicate data"
```

**Acceptance Criteria:**
- [ ] 1,000+ `Fragrance` nodes in Neo4j
- [ ] Zero duplicate nodes (MERGE verified)
- [ ] Prefect flow runs locally via `python ml/flows/weekly_refresh.py`
- [ ] `ml/graph/neo4j_client.py` similarity query returns results

---

## 🚀 MILESTONE 3 — Backend API Completion
> **Goal:** All API endpoints fully implemented, tested, and documented.

**Model:** Codex via `/ccg:backend`.

### GSD Phases:

**Phase 3.1 — Auth Router Completion**
```
/ccg:backend "Complete backend/app/routers/auth.py:
- POST /auth/register (email, password, username)
- POST /auth/login → JWT access + refresh tokens
- POST /auth/refresh → new access token
- POST /auth/logout → invalidate refresh token
- GET /auth/me → current user profile
- GDPR: POST /auth/delete-account (24hr SLA soft delete)"
```

**Phase 3.2 — Fragrances Router**
```
/ccg:backend "Complete backend/app/routers/fragrances.py:
- GET /fragrances → paginated list with filters (brand, gender, accord, year)
- GET /fragrances/{id} → full fragrance detail with notes graph
- GET /fragrances/search?q= → full-text search
- POST /fragrances/{id}/rate → user rating (1-5 stars)
- GET /fragrances/recommendations → personalized recs (stub for M5)"
```

**Phase 3.3 — Users Router**
```
/ccg:backend "Complete backend/app/routers/users.py:
- GET /users/me/collection → user's saved fragrances
- POST /users/me/collection/{id} → add to collection
- DELETE /users/me/collection/{id} → remove
- GET /users/me/ratings → user's rating history
- GET /users/me/taste-profile → derived taste profile from ratings"
```

**Phase 3.4 — Celery Async Tasks**
```
/ccg:backend "Implement backend/app/tasks/:
- Task: rebuild_user_taste_profile(user_id)
- Task: send_welcome_email(user_id)
- Task: process_gdpr_deletion(user_id)
- Retry config, dead letter queue, monitoring"
```

**Phase 3.5 — API Tests**
- 80%+ test coverage on all routers
- Integration tests with test database
- JWT auth tested on all protected routes

**Acceptance Criteria:**
- [ ] Swagger UI at `/docs` shows all endpoints
- [ ] `pytest backend/tests/` — all green
- [ ] Celery worker processes tasks from Redis queue
- [ ] Rate limiting enforced (100 req/min per IP)

---

## 🎨 MILESTONE 4 — Cinematic Frontend (The "WOW" Layer)
> **Goal:** A stunning, production-grade Next.js app that uses StringTune animations throughout. Every interaction feels premium.

**Model:** Gemini via `/ccg:frontend` for all component work. Stitch MCP for design mocks.

### Design System (Start Here)

**Step 1 — Stitch MCP Design System**
```
mcp_StitchMCP_create_project (title: "ScentScapeAI")
mcp_StitchMCP_create_design_system:
  - Primary: #8B5E3C (warm amber-brown)
  - Secondary: #C9A96E (gold)
  - Background Dark: #0D0A08
  - Surface: #1A1410
  - Accent: #FF6B35 (saffron orange)
  - Font: "Cormorant Garamond" (display) + "Inter" (body)
  - Shape: rounded-xl (16px)
  - Appearance: dark mode primary
  - Design MD: "Luxury fragrance discovery. Think perfume bottle meets constellation map. Glassmorphism cards, particle effects, cinematic reveals."
```

**Step 2 — Screen Generation via Stitch MCP**
Generate screens for:
1. Landing / Hero page
2. Discovery / Browse feed
3. Fragrance Detail (note pyramid visualization)
4. User Taste Profile dashboard
5. Collection management
6. Onboarding flow (rate 5 fragrances)

### GSD Phases:

**Phase 4.1 — Design System & Global CSS**
```
/ccg:frontend "Implement the ScentScapeAI design system in frontend/src/:
- CSS custom properties matching Stitch design system
- Import Cormorant Garamond + Inter from Google Fonts
- Glassmorphism utility classes
- Dark mode as default
- StringTune initialization wrapper component
- CSS @property declarations for animation custom properties"
```

**Phase 4.2 — StringTune Integration**
```
/ccg:frontend "Integrate StringTune library (@fiddle-digital/string-tune@1.1.50):
- Install via npm
- Create hooks: useStringTune(), useRevealOnScroll(), useSpotlight(), useMagnetic()
- Create animation components: <RevealOnScroll>, <ParallaxLayer>, <MagneticButton>, <SpotlightCard>
- Reference tutorials in C:\Users\KIIT0001\Videos\Captures\ for implementation patterns"
```

**Phase 4.3 — Landing Page**
- Hero: Full-viewport parallax with floating fragrance bottle SVGs
- Text: Split-text reveal animation
- CTA: Magnetic button with spotlight hover
- Scroll: Reveal-on-scroll sections

**Phase 4.4 — Fragrance Discovery Feed**
- Masonry grid of fragrance cards
- Each card: SpotlightCard component (mouse-tracking spotlight)
- Infinite scroll with lerp-smoothed loading indicator
- Filter sidebar with glide animations

**Phase 4.5 — Fragrance Detail Page**
- Note pyramid: D3.js visualization with reveal-on-scroll
- Accord breakdown: Animated radial chart (Recharts)
- Similar fragrances: Horizontal scroll with impulse snap
- Add to collection: Magnetic + bounce animation

**Phase 4.6 — Onboarding Flow**
- 5-step sequence animation (StringTune `sequence` tutorial pattern)
- Rate fragrances → progress bar (StringTune `progress` tutorial pattern)
- Cinematic transition to taste profile

**Phase 4.7 — Taste Profile Dashboard**
- D3.js constellation/network graph of user's note preferences
- FPS tracker in dev mode (StringTune `fps-tracker` pattern)
- Animated stats cards

**Phase 4.8 — Custom Cursor**
- Implement custom cursor (StringTune `cursor` tutorial pattern)
- Cursor morphs near interactive elements
- Spotlight effect on fragrance cards

**Acceptance Criteria:**
- [ ] Lighthouse performance score ≥ 85
- [ ] All animations at 60fps (verified with FPS tracker)
- [ ] Fully responsive (mobile, tablet, desktop)
- [ ] Playwright E2E: user can browse, view detail, rate fragrance
- [ ] No layout shift (CLS < 0.1)

---

## 🤖 MILESTONE 5 — AI Recommendation Engine
> **Goal:** Real personalized recommendations using GraphSAGE embeddings + Sentence-BERT + Pinecone.

**Model:** Codex for ML engineering, Gemini for any visualization work.

### GSD Phases:

**Phase 5.1 — Sentence-BERT Text Encoder**
```
/ccg:backend "Implement ml/models/text_encoder.py:
- Load sentence-transformers/all-MiniLM-L6-v2
- Encode fragrance descriptions → 384-dim vectors
- Batch encode all fragrances
- Upload embeddings to Pinecone index: scentscape-descriptions"
```

**Phase 5.2 — GraphSAGE Node Embeddings**
```
/ccg:backend "Implement ml/models/graph_sage.py:
- Use PyTorch Geometric GraphSAGE
- Graph: fragrances as nodes, shared notes/accords as edges
- Train on Neo4j graph data
- Output: 128-dim fragrance embeddings
- Upload to Pinecone index: scentscape-graph"
```

**Phase 5.3 — Hybrid Recommendation API**
```
/ccg:backend "Implement backend/app/routers/recommendations.py:
- GET /recommendations/for-me → Bayesian Personalized Ranking from user ratings
- GET /recommendations/similar/{id} → combined GraphSAGE + Sentence-BERT similarity
- GET /recommendations/text?q= → natural language search (Sentence-BERT)
- Celery task: rebuild_embeddings() triggered after data pipeline runs"
```

**Phase 5.4 — Text-Based Natural Language Search**
- "Smoky vanilla with leather notes" → Pinecone ANN → ranked fragrances
- Combine with Neo4j graph traversal for note-based filtering
- Results ranked by hybrid score

**Acceptance Criteria:**
- [ ] Pinecone index populated with 1,000+ embeddings
- [ ] `/recommendations/for-me` returns ranked list in < 500ms
- [ ] Text search `/recommendations/text?q=smoky vanilla` returns relevant results
- [ ] BPR model improves recommendations after 5+ ratings

---

## 🧪 MILESTONE 6 — Integration & E2E Testing
> **Goal:** The whole system works together. No broken seams.

**Ralph Loop for bug fixes:**
```bash
./scripts/ralph/ralph.sh --tool claude 20
```

### GSD Phases:

**Phase 6.1 — Backend Integration Tests**
- Full flow: register → login → browse → rate → get recommendations
- Neo4j ↔ FastAPI integration verified
- Pinecone ↔ FastAPI integration verified
- Celery tasks execute correctly end-to-end

**Phase 6.2 — Frontend E2E Tests (Playwright)**
```
/ccg:frontend "Implement Playwright E2E tests in frontend/tests/:
- test-auth.spec.ts: register, login, logout, rate limit
- test-discovery.spec.ts: browse, filter, search
- test-detail.spec.ts: view fragrance, add to collection
- test-onboarding.spec.ts: rate 5 fragrances, view taste profile
- test-recommendations.spec.ts: verify personalized feed updates"
```

**Phase 6.3 — Performance & Accessibility**
```
/gsd:ui-review 4  (6-pillar visual audit of frontend)
```
- Lighthouse CI: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90
- WCAG 2.1 AA compliance
- Core Web Vitals all green

**Phase 6.4 — Security Audit**
```
/ccg:verify-security  (CCG quality gate)
```
- JWT tokens properly scoped and short-lived
- Rate limiting verified under load
- GDPR deletion flow tested (soft delete → 24hr hard delete)
- No secrets in git history

**Acceptance Criteria:**
- [ ] All Playwright tests pass
- [ ] Lighthouse scores meet targets
- [ ] OWASP common vulnerabilities: none critical
- [ ] Full user journey works end-to-end in staging

---

## 🚢 MILESTONE 7 — Production Deployment
> **Goal:** Live, monitored, scalable production system.

### GSD Phases:

**Phase 7.1 — Railway Backend Deployment**
- `backend/railway.toml` configured correctly
- Environment variables set in Railway dashboard
- PostgreSQL provisioned via Railway
- Redis provisioned via Railway
- Neo4j: Aura (managed) or self-hosted via Railway volume
- Pinecone: Production index activated

**Phase 7.2 — Vercel Frontend Deployment**
- `frontend/vercel.json` configured
- Environment variables: `NEXT_PUBLIC_API_URL` → Railway backend URL
- Preview deployments on PRs
- Production domain configured

**Phase 7.3 — ML Pipeline Cloud**
- Prefect Cloud account configured
- `weekly_refresh` flow deployed as Prefect Deployment
- Trigger: cron `0 2 * * 1` (Monday 02:00 UTC)
- Scraper runs in Railway worker dyno

**Phase 7.4 — Monitoring Stack**
- Sentry: Error tracking for backend + frontend
- Railway metrics: CPU, memory, response time
- Uptime robot: `/health` ping every 5 min
- Prefect Cloud: Flow run history and alerting

**Phase 7.5 — CI/CD Pipeline (.github/workflows)**
```yaml
# On PR → develop:
- Backend tests (pytest)
- Frontend tests (Playwright)
- Type check (mypy + tsc)
- Lint (ruff + eslint)
- Preview deployment (Vercel)

# On merge → main:
- All of above
- Deploy backend → Railway
- Deploy frontend → Vercel production
- Tag release
```

**Acceptance Criteria:**
- [ ] `verify_deployment.py` script passes all checks
- [ ] Backend health check: `https://api.scentscape.app/health` → 200
- [ ] Frontend live and loading in < 3s
- [ ] Prefect weekly flow scheduled and active
- [ ] Sentry receiving events (test trigger)
- [ ] Zero downtime deploy confirmed

---

## 🔄 The Agent Loop in Practice

```
For each Milestone:
  1. /gsd:discuss-phase N         → Capture decisions (you + Antigravity)
  2. /gsd:plan-phase N            → Parallel research agents create atomic plans
  3. /ccg:team-exec               → Agent Teams implement plans in parallel
     - Frontend tasks → Gemini agent
     - Backend tasks → Codex agent  
     - Claude orchestrates
  4. ./scripts/ralph/ralph.sh 15  → Ralph autonomously iterates until prd.json all passes: true
  5. /gsd:verify-work N           → You do UAT (browser open, test each feature)
  6. /ccg:review                  → Codex + Gemini cross-review the diff
  7. /gsd:ship N                  → Creates PR with auto-generated body
  8. Merge → next milestone
```

---

## 📋 Clarifying Questions (Answer Before We Start)

> These must be resolved before kicking off M1:

1. **Scraping target**: What website are the Scrapy spiders targeting? (Fragrantica? Another source?) Do you have permission/ToS clearance?

2. **Neo4j hosting**: Local Docker for dev is fine. For prod — do you have a **Neo4j Aura** account, or should we host on Railway?

3. **Pinecone**: Do you have a Pinecone API key and index set up? Free tier (100k vectors) may be enough for 1,000 fragrances × 2 indexes.

4. **Prefect Cloud**: Free tier or self-hosted? (Free tier = 3 concurrent runs, enough for this project)

5. **Domain**: Is there a custom domain for the app, or are we using Railway/Vercel subdomains?

6. **Timeline**: Is the 8-week estimate acceptable, or is there a hard deadline?

7. **GDPR**: Are real users expected? If yes, we need a proper privacy policy and cookie consent banner (adds ~3 days of work).

---

## 🎯 Week-by-Week Summary

| Week | Milestone | Key Deliverable |
|---|---|---|
| 1 | M1 Foundation | Dev environment 100% working |
| 2 | M2 Data Pipeline | 1,000+ fragrances in Neo4j |
| 3 | M3 Backend APIs | All endpoints implemented + tested |
| 4-5 | M4 Frontend | Cinematic UI with StringTune animations |
| 6 | M5 AI Engine | Personalized recommendations live |
| 7 | M6 Testing | E2E tests green, Lighthouse ≥ 85 |
| 8 | M7 Deployment | Production live, monitored, CI/CD active |

---

*Generated: 2026-03-26 | Antigravity + CCG + GSD + Ralph*
