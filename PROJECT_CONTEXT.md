# Google Photos Retrieval Recovery — Project Context

## 1. Project
Product Management graduation project: Google Photos Core Experience. Build a functional, publicly testable AI-native MVP that addresses retrieval of vaguely remembered photos. This is an independent research prototype, not an official Google product or a connection to users' Google Photos accounts.

**Business objective:** Increase the percentage of users who successfully retrieve a photo they remember but cannot precisely describe when they start searching.

## 2. Evidence and research status
- AI-powered public-source discovery: 60 retrieval episodes organized into an evidence workbook and Discovery Engine. Public evidence is directional, not a representative population sample. Link: **TODO — insert verified published Discovery Engine URL**. Workbook: **TODO — insert view-only link**.
- Analytical retrieval journey (a framework, not a measured conversion funnel): **Express** (memory → usable clues), **Understand** (clues → relevant results), **Recognise** (results → intended photo), **Refine** (weak attempt → next attempt).
- Primary research: eight task-based interviews with experienced Google Photos users, using their own libraries. Each participant could express at least one useful clue. Seven used search and experienced broader/noisier results than expected; one began with timeline scrolling rather than search. All eight retrieved their target during the observed task; five reported difficulty. Participants recovered through various self-selected approaches, including People, timeline, Screenshots category, changed keywords, and Gemini. Some reported that they sometimes give up or leave Photos when normal retrieval fails. These are directional observations from a small convenience sample, not population-level rates.
- Research source: **TODO — link the eight interview notes/repository**. Do not fabricate quotes, results, or participant counts.

## 3. Locked problem definition
**Target segment:** Experienced Google Photos users with several years of usage and large libraries who remember multiple attributes of a photo (such as people, location, or activity) but lack precise retrieval metadata and often narrow results through trial and error.

**Scenario:** A user's first search produces broad, irrelevant, or otherwise unsatisfactory results; the user has to decide what to try next.

**Problem:** After a weak result, users have to figure out the next retrieval step on their own. Available alternatives such as People, categories, timeline browsing, changed keywords, and other tools are independently discovered rather than sufficiently guided by the product.

**Root-cause hypothesis:** Recovery effort is partly caused by insufficient contextual guidance after weak retrieval, not simply an inability to express a memory.

**Important evidence boundary:** Interviews show recovery effort, not observed outright retrieval failure. Do not claim the product diagnosed why results were broad, or that Google Photos has no recovery features at all.

## 4. Proposed intervention and hypothesis
**Working name:** Retrieval Recovery Assistant.

**Intervention point:** Between **Understand** and **Refine**, after the user indicates the initial results did not satisfy their memory.

**MVP hypothesis:** If users receive context-sensitive guidance about which retrieval path to try after a weak first attempt, they may retrieve vaguely remembered photos in fewer recovery steps and with less effort.

The AI should help decide **what to try next**, not merely reword the query or serve as a general photo chatbot.

## 5. MVP user journey
1. User starts a representative retrieval task and enters a natural-language memory.
2. System extracts clues and retrieves candidate photos from a consented or appropriately licensed representative dataset.
3. User reviews initial results. The system does **not** claim failure based solely on result count; the user can explicitly mark the results as unhelpful or request recovery.
4. Recovery Assistant shows extracted clues, distinguishes known from uncertain/missing information, and offers 2–4 relevant next-step options (for example person, approximate time, location, screenshot/category, activity, or visual detail).
5. User chooses an option and provides any additional clue. The system performs a real refined retrieval against the same dataset.
6. User selects a candidate and confirms whether it is the intended target, or continues refining / ends the task.

**Minimum functional requirement:** Another person can complete a real retrieval attempt from start to finish using the deployed app and representative photos. Do not fabricate search results, pretend to access Google Photos, or force an artificially weak result independent of the dataset.

## 6. Technical guardrails
- Plan before coding. Inspect the local environment and propose a minimal stack that supports local development, GitHub, and public deployment (Vercel is preferred if compatible).
- Gemini API is an available option for clue extraction and contextual recovery reasoning; keep keys server-side in environment variables. Provide a useful, honest fallback if AI is unavailable.
- Retrieval and refinement must operate on actual photo records/metadata; deterministic filtering should remain deterministic. Do not imply AI visually analyzed images unless it actually did.
- Use only consented, original, public-domain, or appropriately licensed sample images; track attribution and usage permissions. No personal interview photos without explicit permission.
- Do not expose private user photos, interview notes, API keys, `.env` files, or sensitive analytics in the public GitHub repository or deployment.
- Clearly label the app as an independent Google Photos-inspired research prototype, not affiliated with Google.
- Prefer a compact, accessible UI with visible initial results, a clear **Help me find it** action, and genuinely interactive refinements.

## 7. MVP measurement
**Primary outcome:** Retrieval success after an initial weak result, based on whether the participant confirms finding the intended target.

**Diagnostic measures:** Recovery steps after first weak result; elapsed recovery time; chosen suggestion/path; abandonment; perceived helpfulness. Instrument task start, initial search, initial result review, recovery request, suggestion selection, refined search, photo selection, and confirmed task completion. Use anonymous session/task IDs and avoid collecting photo content or identifiable interview details in analytics.

**Testing:** At least three users from the target segment. Use realistic retrieval tasks and observe behavior. With such a small sample, report per-participant outcomes and qualitative insights; do not claim statistically established improvement. If comparing unguided and guided conditions, use comparable tasks and note task-order and familiarity effects.

## 8. Out of scope for first MVP
- Direct Google Photos account integration, full-library synchronization, and facial identification of real users.
- Generic conversational photo chatbot or full Google Photos redesign.
- Unsupported claims of search-quality improvement, causal lift, or population-level effects.
- Any staged interaction that makes a static UI appear to perform actual retrieval.

## 9. Required project deliverables
- Public link to the previously built AI Discovery Engine and a one-slide explanation of its workflow.
- Publicly accessible and functional AI-native MVP link.
- Evidence of testing with at least three target users, observations, learning, and iteration.
- A final PDF deck of no more than ten slides, including metric decomposition, discovery, user research, problem/root cause, solution rationale, MVP/testing, metrics, and risks/limitations. No fellow name on the deck.
- Final submission deadline: **7 October 2026, 3:59 PM IST**.

## 10. Development workflow
1. Read this file. Identify open decisions and propose architecture **without writing application code**.
2. After approval, create `PRD.md` with screen-by-screen behavior, data schema, recovery logic, instrumentation, acceptance criteria, and technical decisions.
3. Create `TASKS.md` with small, verifiable implementation and testing milestones; update as work proceeds.
4. Implement incrementally, run locally, and test both successful and unsuccessful retrieval paths.
5. Review `.gitignore`, environment variables, image rights, and repository contents before any commit or push.
6. Push to a dedicated GitHub repository, deploy, and test the live URL end-to-end.
7. Conduct and document at least three usability tests; iterate based on observations.

## 11. Decisions still to make
- Final stack and whether the project folder already contains useful code.
- Representative image dataset size, provenance, annotation workflow, and coverage of realistic ambiguous tasks.
- Exact retrieval method and how the app ranks or filters candidates.
- Whether the first version uses Gemini live, a transparent deterministic fallback, or both.
- Privacy-conscious method for exporting usability-test event logs.
- Final app name, GitHub repository URL, deployment URL, and research artifact links.

**Instruction to coding agent:** This document records research and scope, not permission to invent evidence or begin coding. Read it first, explain your proposed implementation and open decisions, and wait for explicit approval before making substantial changes.
