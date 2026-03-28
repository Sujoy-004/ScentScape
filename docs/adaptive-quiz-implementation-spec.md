# Adaptive Quiz Implementation Spec

Date: 2026-03-28
Owner: ScentScape Engineering
Status: Scaffolded

## 1. Goal

Start onboarding with 8 quiz questions and auto-extend only when confidence is low.

- High confidence: stop at 8
- Medium confidence: +3 questions
- Low confidence: +5 questions
- Hard cap: 16 total questions

This is designed to fit existing rating and recommendation routes without replacing them.

## 2. Existing Flow Alignment

Current integration points:

- Frontend quiz UI: `frontend/src/components/StandardQuiz.tsx`
- Frontend app store: `frontend/src/stores/app-store.ts`
- Frontend API client: `frontend/src/lib/api.ts`
- Frontend hooks: `frontend/src/lib/hooks.ts`
- Backend rating endpoint: `POST /users/ratings`
- Backend recommendation endpoints:
  - `POST /fragrances/recommend/profile`
  - `GET /fragrances/recommend/{job_id}`

Adaptive quiz endpoints are added under:

- `POST /fragrances/quiz/session/start`
- `POST /fragrances/quiz/session/{session_id}/responses`
- `POST /fragrances/quiz/session/{session_id}/evaluate`
- `GET /fragrances/quiz/session/{session_id}/next-questions?count=3`

## 3. API Contracts (Exact Payloads)

### 3.1 Start session

Endpoint:

- `POST /fragrances/quiz/session/start`

Request:

```json
{
  "seed_count": 8,
  "candidate_pool_size": 200,
  "filters": {
    "exclude_seen": true
  }
}
```

Response:

```json
{
  "session_id": "qz_6f37f0d7",
  "seed_questions": [
    {
      "fragrance_id": "frag_003",
      "name": "Acqua di Parma",
      "brand": "Acqua di Parma",
      "top_notes": ["Bergamot", "Lemon", "Orange"],
      "accords": ["Citrus", "Woody", "Fresh"]
    }
  ],
  "rules": {
    "min_core_questions": 8,
    "max_total_questions": 16,
    "medium_extension": 3,
    "low_extension": 5,
    "confidence_threshold": 0.72
  },
  "expires_at": "2026-03-28T15:00:00Z"
}
```

### 3.2 Submit one answer

Endpoint:

- `POST /fragrances/quiz/session/{session_id}/responses`

Request:

```json
{
  "fragrance_id": "frag_003",
  "rating_1_to_10": 7.8,
  "source": "quiz_core"
}
```

Response:

```json
{
  "accepted": true,
  "normalized_rating_0_to_5": 3.9,
  "answers_count": 8
}
```

Normalization rule:

- `normalized_rating_0_to_5 = clamp(round(rating_1_to_10 / 2, 2), 0, 5)`

### 3.3 Evaluate confidence

Endpoint:

- `POST /fragrances/quiz/session/{session_id}/evaluate`

Request:

```json
{
  "force": false
}
```

Response (extension required):

```json
{
  "confidence_score": 0.63,
  "confidence_band": "medium",
  "extension_required": true,
  "additional_questions_target": 3,
  "total_answered": 8,
  "stop_reason": null,
  "components": {
    "stability": 0.66,
    "margin": 0.55,
    "consistency": 0.71,
    "coverage": 0.59
  }
}
```

Response (ready to finalize):

```json
{
  "confidence_score": 0.74,
  "confidence_band": "high",
  "extension_required": false,
  "additional_questions_target": 0,
  "total_answered": 10,
  "stop_reason": "confidence_threshold_met",
  "components": {
    "stability": 0.8,
    "margin": 0.68,
    "consistency": 0.7,
    "coverage": 0.61
  }
}
```

### 3.4 Fetch next adaptive questions

Endpoint:

- `GET /fragrances/quiz/session/{session_id}/next-questions?count=3`

Response:

```json
{
  "questions": [
    {
      "fragrance_id": "frag_syn_a174971adb7d",
      "name": "Parfums de Marly Fresh Soleil",
      "brand": "Parfums de Marly",
      "top_notes": ["Bergamot", "Ginger"],
      "accords": ["Fresh", "Citrus"]
    }
  ],
  "count": 1
}
```

## 4. Confidence Model

Confidence score:

- `C = 0.35S + 0.25M + 0.20V + 0.20D`

Components:

- `S`: stability
- `M`: margin
- `V`: consistency
- `D`: coverage

Band thresholds:

- High: `C >= 0.72`
- Medium: `0.58 <= C < 0.72`
- Low: `C < 0.58`

Stopping conditions:

1. `confidence_threshold_met`
2. `hard_cap_reached`
3. `low_marginal_gain` (2 consecutive low-improvement evals)

## 5. Frontend State Machine

Recommended frontend states:

1. `quiz_init`
2. `quiz_core_active`
3. `quiz_core_complete_pending_eval`
4. `quiz_extension_offer`
5. `quiz_extension_active`
6. `quiz_eval_after_extension`
7. `quiz_finalize`
8. `recommendation_job_started`
9. `recommendation_polling`
10. `recommendation_ready`
11. `recommendation_error`

Transitions:

1. `quiz_init -> quiz_core_active`
   - Action: `POST /fragrances/quiz/session/start`
2. `quiz_core_active -> quiz_core_complete_pending_eval`
   - Condition: answered core reaches 8
3. `quiz_core_complete_pending_eval -> quiz_finalize`
   - Condition: no extension required
4. `quiz_core_complete_pending_eval -> quiz_extension_offer`
   - Condition: extension required
5. `quiz_extension_offer -> quiz_extension_active`
   - Action: fetch next questions
6. `quiz_extension_active -> quiz_eval_after_extension`
   - Trigger: each extension answer
7. `quiz_eval_after_extension -> quiz_finalize`
   - Condition: threshold met or stop condition
8. `quiz_finalize -> recommendation_job_started`
   - Action: `POST /fragrances/recommend/profile`
9. `recommendation_job_started -> recommendation_polling`
   - Action: poll `GET /fragrances/recommend/{job_id}`
10. `recommendation_polling -> recommendation_ready | recommendation_error`

## 6. Frontend Store Shape (Scaffolded)

Added `adaptiveQuiz` state in `frontend/src/stores/app-store.ts`:

- `sessionId`
- `phase`
- `confidenceScore`
- `confidenceBand`
- `minCoreQuestions`
- `maxTotalQuestions`
- `extensionTarget`
- `extensionUsed`
- `questionQueue`
- `answeredCount`
- `answeredCoreCount`
- `stopReason`

Actions scaffolded:

- `initializeAdaptiveQuiz`
- `appendAdaptiveQuestions`
- `markAdaptiveAnswer`
- `setAdaptivePhase`
- `setAdaptiveConfidence`
- `resetAdaptiveQuiz`

## 7. API Client + Hook Scaffolding

Added typed frontend methods in `frontend/src/lib/api.ts`:

- `startAdaptiveQuizSession`
- `submitAdaptiveQuizResponse`
- `evaluateAdaptiveQuizSession`
- `getAdaptiveQuizNextQuestions`

Added `useAdaptiveQuizSession` hook in `frontend/src/lib/hooks.ts` with mutations:

- `startSession`
- `submitResponse`
- `evaluateSession`
- `fetchNextQuestions`

## 8. Backend Scaffold Details

Added:

- `backend/app/services/quiz_store.py` (Redis session store with TTL)
- `backend/app/routers/quiz.py` (session, responses, evaluate, next questions)
- Router registration in `backend/app/main.py`

Behavior notes:

- Quiz session ownership is enforced by authenticated `user_id`.
- Session data is stored in Redis with 30-minute TTL.
- Next question selection uses uncertainty/diversity/engagement weighted ranking.

## 9. Rollout Plan

Phase A: shadow mode
- Run evaluation without extension UI.

Phase B: partial rollout
- Enable extension for a subset of users.

Phase C: full rollout
- Enable adaptive extension for all users.

Guardrails:

- Onboarding completion drop < 3%
- Recommendation engagement uplift >= 8%
- No increase in recommendation failure rate

## 10. Next Implementation Steps

1. Wire `StandardQuiz` to adaptive endpoints under a feature flag.
2. Emit analytics events for each adaptive transition.
3. Add backend tests for session ownership, evaluate branching, and next-question constraints.
4. Add frontend tests for core-only, medium extension, low extension, and skip-extension paths.
