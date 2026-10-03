/**
 * TypeScript Interfaces for Google Photos Retrieval Recovery MVP
 * Location: src/lib/types.ts
 */

// ============================================================================
// 1. Photo Metadata
// ============================================================================

export type PhotoCategory = 'photo' | 'screenshot' | 'document';
export type PhotoSetting = 'indoors' | 'outdoors' | 'digital';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface LocationInfo {
  name: string;
  city: string;
  country: string;
  setting: PhotoSetting;
}

export interface PhotoItem {
  id: string;
  filename: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  year: number;
  month: number; // 1-12
  season: Season;
  location: LocationInfo;
  people: string[];
  activities: string[];
  objects: string[];
  event: string;
  category: PhotoCategory;
  visual_tags: string[];
  ocr_text: string;
  source: string;
  license: string;
}

// ============================================================================
// 2. Benchmark Task
// ============================================================================

export interface ExpectedClues {
  people?: string[];
  activities?: string[];
  location?: Partial<LocationInfo> | string;
  time_frame?: {
    year?: number;
    month?: number;
    season?: Season;
  };
  visual_tags?: string[];
  category?: PhotoCategory;
  event?: string;
  ocr_text?: string;
  setting?: PhotoSetting;
  objects?: string[];
  time_of_day?: string;
}

export interface BenchmarkTask {
  id: string;
  title: string;
  target_photo_id: string;
  prompt: string;
  expected_clues: ExpectedClues;
  known_near_miss_ids: string[];
  expected_recovery_dimensions: string[];
}

// ============================================================================
// 3. Structured Clues & Retrieval Query
// ============================================================================

export interface StructuredClues {
  category?: PhotoCategory | null;
  time_frame?: {
    year?: number | null;
    month?: number | null;
    season?: Season | null;
  } | null;
  people?: string[];
  location?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
    setting?: PhotoSetting | null;
  } | null;
  activities?: string[];
  objects?: string[];
  event?: string | null;
  visual_tags?: string[];
  ocr_text?: string | null;
}

export interface SearchQuery {
  raw_query: string;
  clues: StructuredClues;
}

// ============================================================================
// 4. Retrieval Scoring & candidate Item Breakdown
// ============================================================================

export interface ScoreBreakdown {
  category_score: number;  // Max 30
  date_score: number;      // Max 25
  people_score: number;    // Max 20
  location_score: number;  // Max 15
  activity_score: number;  // Max 10
  tags_ocr_score: number;  // Max 10
  total_score: number;
}

export interface ScoredPhotoItem {
  photo: PhotoItem;
  score: number;
  score_breakdown: ScoreBreakdown;
  matched_clues: string[];
}

// ============================================================================
// 5. Weak-Result Evaluation (Deterministic Rule Engine Output)
// ============================================================================

export type WeakResultReasonCode =
  | 'HIGH_COUNT_LOW_SEPARATION'
  | 'LOW_CLUE_COVERAGE'
  | 'ZERO_MATCHES'
  | 'CATEGORY_AMBIGUITY'
  | 'NONE';

export interface WeakResultEvaluation {
  is_weak_result: boolean;
  reason_code: WeakResultReasonCode;
  explanation: string;
  total_candidates: number;
  top_score: number;
  score_separation_ratio: number;
}

export interface SearchResult {
  query: SearchQuery;
  candidates: ScoredPhotoItem[];
  weak_result_eval: WeakResultEvaluation;
  execution_time_ms: number;
}

// ============================================================================
// 6. Recovery Assistant Suggestion & AI Output
// ============================================================================

export type RecoveryDimension =
  | 'category'
  | 'time_frame'
  | 'people'
  | 'location'
  | 'activities'
  | 'objects'
  | 'ocr_text';

export interface RecoverySuggestion {
  id: string;
  dimension: RecoveryDimension;
  label: string;             // Human-readable action label (e.g. "Filter by Category: Screenshot")
  prompt_question: string;    // Follow-up question (e.g. "Was this a screenshot, document, or photo?")
  suggested_value?: string;
}

export interface ClueAnalysis {
  known_clues: string[];
  missing_dimensions: RecoveryDimension[];
  suggestions: RecoverySuggestion[];
  is_fallback_mode: boolean;  // True if generated via deterministic fallback engine
}

// ============================================================================
// 7. Refinement Action
// ============================================================================

export interface RefinementAction {
  selected_suggestion_id: string;
  dimension: RecoveryDimension;
  user_response_text: string;
  updated_clues: StructuredClues;
}

// ============================================================================
// 8. Retrieval Session & Task State
// ============================================================================

export type TaskStatus =
  | 'IDLE'
  | 'INITIAL_SEARCH'
  | 'REVIEWING_RESULTS'
  | 'RECOVERY_ACTIVE'
  | 'REFINING'
  | 'TARGET_FOUND'
  | 'ABANDONED';

export interface RetrievalSessionState {
  session_id: string;
  task?: BenchmarkTask | null;
  initial_raw_query: string;
  current_clues: StructuredClues;
  search_history: SearchResult[];
  active_step_count: number;
  status: TaskStatus;
  confirmed_photo_id?: string | null;
  is_target_correct?: boolean | null;
  start_timestamp: number;
  last_updated_timestamp: number;
}

// ============================================================================
// 9. Analytics Instrumentation Events
// ============================================================================

export type TelemetryEventType =
  | 'TASK_START'
  | 'QUERY_SUBMIT'
  | 'INITIAL_RESULTS_LOADED'
  | 'WEAK_RESULT_DETECTED'
  | 'RECOVERY_OPENED'
  | 'SUGGESTION_CLICKED'
  | 'CLUE_ADDED'
  | 'REFINED_SEARCH_SUBMIT'
  | 'PHOTO_SELECTED'
  | 'TASK_CONFIRMED_SUCCESS'
  | 'TASK_ABANDONED';

export interface TelemetryEvent {
  event_id: string;
  session_id: string;
  task_id?: string | null;
  event_type: TelemetryEventType;
  timestamp: number;
  elapsed_seconds: number;
  recovery_step_count: number;
  payload: Record<string, unknown>;
}
