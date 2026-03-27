# Local Stack Runbook

This document defines the strict boot order and health checks for running the ScentScapeAI stack locally.

## Execution Snapshot (2026-03-26)

### Step 1 (M6 validation subset) - Completed
- Backend targeted tests run: `tests/test_auth.py`, `tests/test_celery.py`, `tests/test_health.py`, `tests/test_integration.py`.
- Result: `13 passed`, `0 failed`.
- Compatibility fixes applied during validation:
  - Updated async test client fixture for current `httpx` (`ASGITransport`).
  - Added settings compatibility for `NEO4J_USERNAME` and ignored unrelated extra env vars.
  - Guarded Sentry init for placeholder DSN values.
  - Ensured JWT uniqueness with per-token `jti` to avoid refresh token uniqueness collisions.
  - Restored missing `GET /fragrances` list endpoint for integration flow.

### Step 2 (M7 deployment preflight) - Completed
- Ran `verify_deployment.py` after dependency setup.
- Result: `2/8 services healthy` in current local context.
- Current blockers from verifier run:
  - Frontend URL placeholder returns `404`.
  - Backend health/root unavailable on `localhost:8000` (service not running at verification time).
  - PostgreSQL DSN scheme mismatch in verifier (`postgresql+asyncpg` not accepted by checker).
  - Neo4j host `neo4j` and Redis host `redis` not resolvable from current host context (expected if compose network services are not up).
- Optional checks reported as pass/skip by verifier:
  - Pinecone API key optional in local mode.
  - Sentry DSN optional when unset.

## Boot Order
1. **Infrastructure** (Database, Cache, Graph DB)
2. **Backend API & Background Workers** (FastAPI, Celery)
3. **Frontend** (Next.js)

---

## 🏗️ Stage 1: Infrastructure

**Command:**
```powershell
docker-compose up -d
```
*(If you have a selective compose file, start specific services like `db`, `redis`, `neo4j` first).*

**Health Checks:**
- Ensure all containers are running:
  ```powershell
  docker ps
  ```
- Check database logs for readiness:
  ```powershell
  docker compose logs db | Select-String "database system is ready to accept connections"
  ```
- Check Neo4j logs:
  ```powershell
  docker compose logs neo4j
  ```

---

## ⚙️ Stage 2: Backend API & Workers

**Command (Terminal 1 - FastAPI):**
```powershell
cd backend
# Ensure virtual environment is activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Command (Terminal 2 - Celery Worker):**
```powershell
cd backend
# Ensure virtual environment is activated
celery -A app.celery_app worker --loglevel=info
```

**Health Checks:**
- Test REST API Health Endpoint:
  ```powershell
  curl http://localhost:8000/health
  # Expected output: {"status": "ok"} or similar 200 OK response
  ```
- Test Celery Worker Health:
  ```powershell
  celery -A app.celery_app inspect ping
  ```

---

## 🎨 Stage 3: Frontend

**Command (Terminal 3 - Next.js):**
```powershell
cd frontend
npm run dev
```

**Health Checks:**
- Verify application rendering:
  ```powershell
  curl -I http://localhost:3000
  # Expected output: HTTP/1.1 200 OK
  ```
- Open `http://localhost:3000` in your browser.

---

## 🛑 Teardown

To shut down the stack gracefully:
```powershell
# Stop frontend and backend processes via Ctrl+C in their respective terminals
# Then spin down infrastructure:
docker-compose down
```

---

## ✅ Stage 4: ML Validation and Release Gates

Use profile-driven validation to match environment rigor.

### Local Validation

```powershell
cd ml
python -m tests.test_integration --cleanup --profile local
```

### Staging Validation

```powershell
cd ml
python -m tests.test_integration --cleanup --profile staging
```

### Production-Grade Validation (Strict)

```powershell
cd ml
python -m tests.test_integration --cleanup --profile production --strict
```

### Deterministic Release Gate (Required for Promotion)

```powershell
cd ml
python -m tests.release_gate --profile production --strict --cycles 3
```

Artifacts are generated under:
- `ml/logs/integration/`
- `ml/logs/release_gate/`