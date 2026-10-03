# Product Requirements Document (PRD) — Google Photos Retrieval Recovery MVP

## 1. Problem Statement
Experienced Google Photos users with large photo libraries frequently experience weak, broad, or unsatisfactory results after an initial natural-language memory query. When this happens, available retrieval paths (such as filtering by people, refining date ranges, filtering by document/screenshot category, or specifying activities) must be independently figured out by the user through trial and error. The product currently lacks active, context-sensitive guidance to help users recover from weak retrieval attempts.

## 2. Target User & Scenario
- **Target User**: Experienced Google Photos users with several years of usage and large photo libraries. They remember multiple contextual clues (people, timeframe, location, activity, visual details, or document type) but lack exact metadata or keywords.
- **Scenario**: A user remembers a specific photo (e.g. a concert ticket screenshot, a family sunset at the beach, a receipt from last winter) and inputs an initial memory query. The initial results return either too many broad results, irrelevant images, or zero matches. The user must decide what to try next.

## 3. Product Outcome & MVP Hypothesis
- **Product Outcome**: Increase the percentage of users who successfully retrieve a vaguely remembered photo after a weak initial attempt, while reducing recovery steps and perceived search effort.
- **MVP Hypothesis**: If users receive context-sensitive guidance about which retrieval path to try after a weak first attempt, they can retrieve vaguely remembered photos in fewer recovery steps and with less effort.

## 4. User Journey
1. **Task Initiation**: User selects a preset test scenario or enters a free natural-language memory query on the home page or `/test-tasks`.
2. **Clue Extraction & Initial Retrieval**: System uses Gemini API to parse natural-language memory into structured clues, then runs a transparent deterministic retrieval query against the controlled representative photo dataset.
3. **Result Review & Weak-Result Detection**: Results are rendered. The system calculates a deterministic weak-result status. If results are broad, low-confidence, or empty, a clear **"Help me find it"** trigger is emphasized (though users can manually invoke it at any time).
4. **Recovery Assistant Engagement**: User opens the Recovery Assistant. It displays extracted clues categorized as *Known Clues* vs. *Missing/Weak Clues* and offers 2–4 actionable next-step refinement options based on unconstrained metadata dimensions in candidate photos.
5. **Interactive Refinement**: User selects a suggestion (e.g., "Filter by Category: Screenshot", "Refine Timeframe: Summer 2024", "Specify Location: Beach") and provides optional extra details.
6. **Refined Retrieval**: System updates structured clues and re-runs deterministic search.
7. **Confirmation & Telemetry**: User selects candidate photo, confirms whether it is the target photo, and logs anonymous task completion metrics.

---

## 5. Functional Requirements

### 5.1 Search & Clue Extraction Interface
- Single input bar supporting natural-language memory phrases.
- Quick-launch preset task buttons on main page and dedicated `/test-tasks` benchmark page.
- Clear display of currently active retrieval filters/clues above results.

### 5.2 Deterministic Retrieval Engine (V1 Architecture)
- Fully explainable metadata-based scoring function (No vector embeddings or black-box similarity in V1).
- Multi-attribute weighted scoring:
  $$\text{Score}(P) = S_{\text{category}} + S_{\text{date}} + S_{\text{people}} + S_{\text{location}} + S_{\text{activity}} + S_{\text{tags\_ocr}}$$
  - **Category Match ($S_{\text{category}}$)**: Weight = 30. Exact match on `photo`, `screenshot`, `document`, `receipt`.
  - **Date / Timeframe Match ($S_{\text{date}}$)**: Weight = 25. Range match on year, month, season, or exact date.
  - **People Match ($S_{\text{people}}$)**: Weight = 20. Match on tagged names.
  - **Location & Setting Match ($S_{\text{location}}$)**: Weight = 15. Match on city, country, venue, or indoor/outdoor setting.
  - **Activity & Visual Tags ($S_{\text{activity}}$)**: Weight = 10. Match on activity tags and OCR text.
- Transparent score breakdown returned alongside each candidate photo for debugging and verification.

### 5.3 Deterministic Weak-Result Definition
A retrieval result set is deterministically flagged as **"Weak / Broad"** if ANY of the following rules evaluate to `true`:
1. **High Result Count with Low Separation**: $\text{Count} > 8$ candidate photos and $(\text{TopScore} - \text{8thScore}) / \text{TopScore} < 0.15$ (broad, noisy result set).
2. **Low Query Clue Coverage**: Initial query expressed $\ge 2$ structured clues, but top candidate matches $< 50\%$ of expressed clues.
3. **Zero Match**: Candidate result set count $= 0$.
4. **Category Ambiguity**: Query contains category hint (e.g., "ticket", "bill", "menu") but category filter was unconstrained, returning mixed media types.

*Note: The "Help me find it" button remains accessible at all times, even if the result set is not auto-flagged as weak.*

### 5.4 AI Responsibilities (Gemini API Integration)
Gemini is used exclusively server-side via `@google/genai` for reasoning tasks:
1. **Initial Natural Language Clue Extraction**: Parses raw query string into a structured JSON clue object:
   ```json
   {
     "category": "screenshot" | "photo" | "document" | null,
     "time_frame": { "year": 2024, "season": "summer", "month": null },
     "people": ["Alice"],
     "location": { "name": "beach", "setting": "outdoors" },
     "activity": "bonfire", "visual_tags": ["fire", "sunset"]
   }
   ```
2. **Missing Dimension Analysis & Recovery Suggestions**: Evaluates candidate result metadata coverage against current clues to generate 2–4 targeted, context-aware suggestions (e.g., *"Filter by Category: Screenshot"*, *"Refine Date: Summer 2024"*, *"Add Person"*).
3. **Refinement Input Parsing**: Converts user's natural language response to a suggestion into updated structured retrieval clues.
4. **Model Configuration**: Configured via environment variable (`GEMINI_MODEL`, defaulting to a currently supported Flash-class model like `gemini-2.5-flash`).

### 5.5 Deterministic Fallback Engine
- If Gemini API is offline, missing an API key, or times out (> 2.5s), a local deterministic heuristic engine takes over:
  - Regex keyword matcher extracts basic dates, categories, and tags.
  - Basic rule generator presents standard next-step options based on missing metadata fields.
- **UI Branding**: Fallback mode is explicitly labeled in UI as *"Basic Recovery (Offline Mode)"* and is not presented as equivalent to the AI-guided experience.

---

## 6. Dataset Specification & Provenance
- **Dataset Size**: ~100 curated representative photos stored locally in `public/dataset/` with metadata index in `data/photos.json`.
- **Composition**:
  - Personal photos (family, vacations, dining, pets, nature).
  - Screenshots (tickets, maps, social posts, text messages).
  - Documents (receipts, medical forms, menus, written notes).
- **Metadata Schema**:
  - `id`: unique string identifier.
  - `filename`: path relative to `public/dataset/`.
  - `title` & `description`: human readable description.
  - `category`: `photo` | `screenshot` | `document` | `receipt`.
  - `date`: `YYYY-MM-DD`, `year`, `month`, `season`.
  - `people`: array of strings.
  - `location`: `{ city, country, venue, setting }`.
  - `activity`: string.
  - `tags`: array of visual/conceptual tags.
  - `ocr_text`: string (for screenshots/documents).
  - `provenance`: `{ source: "Unsplash" | "Wikimedia" | "Original", author: string, license: string, source_url: string }`.
- **Controlled Benchmark Target Photos**: Specific photos in the dataset map directly to the 4 preset usability test scenarios to ensure reproducible testing.

---

## 7. Usability Testing & Analytics Requirements

### 7.1 Preset Benchmark Tasks (`/test-tasks`)
1. **Task 1 (Category / Screenshot Clue)**: *"Find the concert ticket screenshot from last summer."*
2. **Task 2 (Time / Setting Clue)**: *"Find the beach sunset photo with bonfire from 2024."*
3. **Task 3 (People / Activity Clue)**: *"Find the photo of Alex eating pizza at a birthday party."*
4. **Task 4 (Document / Receipt Clue)**: *"Find the coffee shop receipt from last month."*

### 7.2 Instrumentation & Telemetry
Every session captures anonymous events:
- `session_id`, `task_id` (anonymous string).
- Event types: `TASK_START`, `QUERY_SUBMIT`, `INITIAL_RESULTS_LOADED`, `WEAK_RESULT_DETECTED`, `RECOVERY_OPENED`, `SUGGESTION_CLICKED`, `CLUE_ADDED`, `REFINED_SEARCH_SUBMIT`, `PHOTO_SELECTED`, `TASK_CONFIRMED_SUCCESS`, `TASK_ABANDONED`.
- Metrics captured: `recovery_step_count`, `elapsed_recovery_time_seconds`, `perceived_helpfulness_rating` (1–5 scale).
- **Data Export**: JSON file export button on `/test-tasks` and admin header for usability test reporting.

---

## 8. Success Criteria
1. **Functional Completion**: 100% of preset usability tasks can be completed end-to-end against real dataset photos on the live deployed web app.
2. **Usability Verification**: Tested with at least 3 target users; per-participant task completion, step counts, and qualitative feedback recorded.
3. **Performance & Reliability**: Query execution and AI recovery suggestion generation respond within < 3 seconds on live deployment.

---

## 9. Non-Goals & Boundaries
- Direct Google Photos account OAuth or library synchronization.
- Facial recognition or real-time visual image AI extraction.
- Semantic vector embeddings or vector database infrastructure in V1.
- Generic conversational photo chatbot UI.
- Population-level statistical claims or unverified search performance claims.
