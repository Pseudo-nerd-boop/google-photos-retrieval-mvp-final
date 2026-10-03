# Implementation Tasks — Google Photos Retrieval Recovery MVP

This document outlines the sequential, step-by-step implementation tasks required to build, test, and deploy the Google Photos Retrieval Recovery MVP.

---

## Phase 1: Setup & Infrastructure
- [ ] **T-01: Initialize Next.js Application**
  - Initialize Next.js 14+ with App Router, TypeScript, Tailwind CSS, and Lucide React icons.
  - Verify project directory structure (`src/app`, `src/components`, `src/lib`, `data/`, `public/dataset/`).
- [ ] **T-02: Configure Environment Variables & Dependencies**
  - Install `@google/genai` SDK and utility dependencies (`clsx`, `tailwind-merge`).
  - Configure `.env.local` template with `GEMINI_API_KEY` and `GEMINI_MODEL` (e.g., `gemini-2.5-flash`).
  - Ensure `.env.local` is added to `.gitignore`.

---

## Phase 2: Dataset Curation & Asset Management
- [ ] **T-03: Collect Controlled Dataset Images**
  - Gather ~100 high-quality images (personal/CC0/Unsplash/Wikimedia) covering screenshots, receipts, tickets, personal photos, travel, and documents.
  - Store image files in `public/dataset/`.
- [ ] **T-04: Build Master Photo Metadata Database (`data/photos.json`)**
  - Create `data/photos.json` with full attribute schema: `id`, `filename`, `title`, `description`, `category`, `date`, `year`, `month`, `season`, `people`, `location`, `activity`, `tags`, `ocr_text`, `provenance`.
  - Include specific target photos for all 4 benchmark usability test scenarios.
  - Record license and source attribution metadata for every image.

---

## Phase 3: Deterministic Retrieval Engine
- [ ] **T-05: Implement TypeScript Interfaces (`src/lib/types.ts`)**
  - Define interfaces for `PhotoItem`, `ClueStructure`, `SearchResult`, `RecoverySuggestion`, `TelemetryEvent`, and `BenchmarkTask`.
- [ ] **T-06: Implement Transparent Retrieval Engine (`src/lib/search-engine.ts`)**
  - Build metadata scoring algorithm ($S_{\text{category}} + S_{\text{date}} + S_{\text{people}} + S_{\text{location}} + S_{\text{activity}} + S_{\text{tags\_ocr}}$).
  - Return sorted candidates with detailed score breakdowns for explainability.
- [ ] **T-07: Implement Deterministic Weak-Result Classifier**
  - Code weak-result rules: (1) Count > 8 with top-score delta < 15%, (2) Query clue coverage < 50%, (3) Zero matches, (4) Unconstrained category ambiguity.
  - Return `isWeakResult: boolean` and `weakResultReason: string` in search response.

---

## Phase 4: Gemini AI Integration & Fallback Engine
- [ ] **T-08: Build Gemini Client Module (`src/lib/gemini.ts`)**
  - Configure `@google/genai` client using `process.env.GEMINI_MODEL`.
  - Implement `extractCluesFromQuery(query: string)` with structured JSON schema output.
  - Implement `generateRecoverySuggestions(currentClues, missingDimensions, resultMetadata)` to produce 2–4 targeted recovery paths.
  - Implement `parseRefinementInput(userResponse, selectedSuggestion, currentClues)` to update clue structure.
- [ ] **T-09: Build Deterministic Fallback Engine (`src/lib/fallback-engine.ts`)**
  - Build regex/rule-based fallback for clue extraction and suggestion generation when Gemini API is offline or fails.
  - Include explicit indicator `isFallbackMode: true` in response.
- [ ] **T-10: Create API Routes**
  - `/api/search`: Handles search queries and clue filtering.
  - `/api/recovery`: Handles AI clue extraction and next-step recovery suggestions.

---

## Phase 5: Recovery Assistant Logic
- [ ] **T-11: Implement Recovery State Manager**
  - Manage state transition: Initial Query -> Evaluation -> Recovery Assistant Active -> Refinement Input -> Refined Results.
  - Maintain history of added clues and previous attempts.

---

## Phase 6: Frontend Components & UI Layout
- [ ] **T-12: Header & Search Controls (`src/components/SearchHeader.tsx`)**
  - Clean search bar, active clue badges/chips, and quick prompt clear button.
- [ ] **T-13: Results Grid & Candidate Viewer (`src/components/PhotoGrid.tsx`)**
  - Responsive photo grid display, candidate photo modal with detailed metadata inspector.
- [ ] **T-14: Evaluation & Weak Result Bar (`src/components/EvaluationBar.tsx`)**
  - Banner indicating search outcome and prominent **"Help me find it"** button.
- [ ] **T-15: Recovery Assistant Panel (`src/components/RecoveryAssistant.tsx`)**
  - Modal/Drawer showing *Known Clues*, *Missing Dimensions*, 2–4 suggestion chips, and interactive refinement input box.
- [ ] **T-16: Target Verification & Success Modal (`src/components/FeedbackModal.tsx`)**
  - Modal asking *"Is this your target photo?"* with task completion logger and 1–5 perceived helpfulness rating.

---

## Phase 7: Analytics & Testing Tools
- [ ] **T-17: Event Logging Module (`src/lib/analytics.ts`) & `/api/events` API**
  - Capture anonymous session events (`session_id`, `task_id`, `step_name`, `elapsed_seconds`, `action_taken`).
  - Store events in local storage with server backup.
- [ ] **T-18: Benchmark Usability Page (`src/app/test-tasks/page.tsx`)**
  - Build `/test-tasks` route displaying preset benchmark scenarios (Tasks 1–4) with one-click start.
  - Include **"Export Session Logs (JSON)"** button for testing evaluation export.

---

## Phase 8: Testing & Verification
- [ ] **T-19: End-to-End Local Testing**
  - Test all 4 benchmark tasks using Gemini API mode.
  - Test all 4 benchmark tasks using Offline Fallback mode (disconnect API key).
  - Verify deterministic weak-result rules fire correctly on ambiguous queries.
  - Verify scoring explainability outputs.

---

## Phase 9: Git, Repository Security & GitHub
- [ ] **T-20: Repository Security Audit**
  - Audit `.gitignore` to ensure `.env`, `.env.local`, node_modules, and build outputs are excluded.
  - Verify no secret keys or private data are committed.
- [ ] **T-21: Commit & Push to GitHub**
  - Initialize clean git repository, create commits for PRD, setup, engine, components, and tests.
  - Push codebase to dedicated GitHub repository.

---

## Phase 10: Vercel Deployment
- [ ] **T-22: Deploy to Vercel**
  - Connect GitHub repo to Vercel.
  - Configure production environment variables (`GEMINI_API_KEY`, `GEMINI_MODEL`).
  - Deploy build and verify live site URL functionality.

---

## Phase 11: Final QA & Usability Evaluation
- [ ] **T-23: Usability Testing & Log Collection**
  - Conduct usability tests with at least 3 target users on the deployed Vercel URL.
  - Export anonymized session JSON logs and record task success rate and recovery steps.
- [ ] **T-24: Documentation & Final Verification**
  - Update `README.md` with live app link, disclaimer, architectural overview, and research context.
