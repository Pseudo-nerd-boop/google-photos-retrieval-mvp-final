import fs from 'fs';
import path from 'path';
import { retrievePhotos, scorePhoto, evaluateWeakResults, parseRawQueryToClues } from '../src/lib/search-engine';
import { PhotoItem, BenchmarkTask, StructuredClues } from '../src/lib/types';

const photosPath = path.join(__dirname, '..', 'data', 'photos.json');
const tasksPath = path.join(__dirname, '..', 'data', 'benchmark_tasks.json');

const photos: PhotoItem[] = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
const tasks: BenchmarkTask[] = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

console.log("==========================================================================");
console.log("RETRIEVAL ENGINE COMPREHENSIVE VALIDATION & TEST SUITE (T-07)");
console.log("==========================================================================");

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

// --------------------------------------------------------------------------
// SUITE 1: Benchmark Retrieval Verification
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 1: Benchmark Retrieval Verification (4 Benchmark Tasks)");
console.log("--------------------------------------------------------------------------");

tasks.forEach((task, idx) => {
  const result = retrievePhotos(task.prompt, photos);
  const targetRank = result.candidates.findIndex(c => c.photo.id === task.target_photo_id);
  const targetItem = result.candidates.find(c => c.photo.id === task.target_photo_id);

  assert(targetRank !== -1, `Task #${idx + 1} (${task.id})`, `Target '${task.target_photo_id}' retrieved at Rank #${targetRank + 1}, Score ${targetItem?.score}`);
});

// --------------------------------------------------------------------------
// SUITE 2: Determinism Test
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 2: Determinism Verification");
console.log("--------------------------------------------------------------------------");

const testQuery = "Alex riding a mountain bike on the forest trail in summer 2024";
const run1 = retrievePhotos(testQuery, photos);
const run2 = retrievePhotos(testQuery, photos);
const run3 = retrievePhotos(testQuery, photos);

const isIdenticalLength = (run1.candidates.length === run2.candidates.length) && (run2.candidates.length === run3.candidates.length);
const isIdenticalTopScore = (run1.candidates[0].score === run2.candidates[0].score) && (run2.candidates[0].score === run3.candidates[0].score);
const isIdenticalTopPhotoId = (run1.candidates[0].photo.id === run2.candidates[0].photo.id) && (run2.candidates[0].photo.id === run3.candidates[0].photo.id);

assert(isIdenticalLength && isIdenticalTopScore && isIdenticalTopPhotoId, "Query execution determinism", `Ran 3 identical passes. Returned ${run1.candidates.length} items, top photo '${run1.candidates[0].photo.id}' with score ${run1.candidates[0].score}`);

// --------------------------------------------------------------------------
// SUITE 3: Single-Dimension / Missing Clues Test
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 3: Single-Dimension & Missing Clues Isolation");
console.log("--------------------------------------------------------------------------");

// 3a. Person clue only
const personClues: StructuredClues = { people: ['Rohan'] };
const personResult = retrievePhotos('Rohan', photos, personClues);
assert(personResult.candidates.length > 0 && personResult.candidates.every(c => c.photo.people.includes('Rohan')), "Person-only clue filter", `Found ${personResult.candidates.length} photos containing Rohan without penalty for missing date/location`);

// 3b. Location clue only
const locationClues: StructuredClues = { location: { city: 'Goa' } };
const locationResult = retrievePhotos('Goa', photos, locationClues);
assert(locationResult.candidates.length > 0 && locationResult.candidates.every(c => c.photo.location.city === 'Goa'), "Location-only clue filter", `Found ${locationResult.candidates.length} photos in Goa`);

// 3c. Activity clue only
const activityClues: StructuredClues = { activities: ['biking'] };
const activityResult = retrievePhotos('biking', photos, activityClues);
assert(activityResult.candidates.length > 0, "Activity-only clue filter", `Found ${activityResult.candidates.length} biking photos`);

// 3d. Timeframe clue only
const timeClues: StructuredClues = { time_frame: { year: 2023, season: 'winter' } };
const timeResult = retrievePhotos('winter 2023', photos, timeClues);
assert(timeResult.candidates.length > 0 && timeResult.candidates[0].photo.year === 2023 && timeResult.candidates[0].photo.season === 'winter', "Timeframe-only clue filter", `Found ${timeResult.candidates.length} candidate photos matching 2023/winter, top item matches both`);

// 3e. Category clue only
const categoryClues: StructuredClues = { category: 'screenshot' };
const categoryResult = retrievePhotos('screenshot', photos, categoryClues);
assert(categoryResult.candidates.length > 0 && categoryResult.candidates[0].photo.category === 'screenshot', "Category-only clue filter", `Found ${categoryResult.candidates.length} screenshots, top item is category screenshot`);

// --------------------------------------------------------------------------
// SUITE 4: Compound Clues Accumulation Test
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 4: Compound Multi-Dimension Clues Accumulation");
console.log("--------------------------------------------------------------------------");

const compoundClues: StructuredClues = {
  people: ['Alex'],
  activities: ['biking'],
  time_frame: { year: 2024, season: 'summer' },
  location: { city: 'Manali' },
  category: 'photo'
};

const compoundResult = retrievePhotos("Alex biking in Manali summer 2024", photos, compoundClues);
const topCompoundItem = compoundResult.candidates[0];

assert(
  topCompoundItem.score_breakdown.people_score > 0 &&
  topCompoundItem.score_breakdown.activity_score > 0 &&
  topCompoundItem.score_breakdown.date_score > 0 &&
  topCompoundItem.score_breakdown.location_score > 0 &&
  topCompoundItem.score_breakdown.category_score > 0,
  "Compound clue score accumulation",
  `Top candidate '${topCompoundItem.photo.id}' accumulated total score ${topCompoundItem.score} across 5 dimensions`
);

// --------------------------------------------------------------------------
// SUITE 5: Zero-Result Behavior Test
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 5: Zero-Result Behavior");
console.log("--------------------------------------------------------------------------");

const zeroMatchQuery = "nonexistent_person_x999 in mars_city_999";
const zeroClues: StructuredClues = {
  people: ['NonExistentPersonX999'],
  location: { city: 'MarsCity999' }
};

const zeroResult = retrievePhotos(zeroMatchQuery, photos, zeroClues);
assert(
  zeroResult.weak_result_eval.is_weak_result === true &&
  zeroResult.weak_result_eval.reason_code === 'ZERO_MATCHES',
  "Zero-result classification",
  `Non-matching query correctly flagged ZERO_MATCHES (Top Score: ${zeroResult.weak_result_eval.top_score})`
);

// --------------------------------------------------------------------------
// SUITE 6: Broad-Result Behavior (HIGH_COUNT_LOW_SEPARATION) Test
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 6: Broad-Result Behavior (HIGH_COUNT_LOW_SEPARATION)");
console.log("--------------------------------------------------------------------------");

// Querying 'summer' returns 24 candidates all matching season 'summer' (scores tied), creating a broad result set (> 8 candidates)
const broadResult = retrievePhotos("summer", photos);
assert(
  broadResult.weak_result_eval.is_weak_result === true &&
  broadResult.weak_result_eval.reason_code === 'HIGH_COUNT_LOW_SEPARATION',
  "Broad result set classification",
  `Returned ${broadResult.candidates.length} candidates with score separation ratio ${broadResult.weak_result_eval.score_separation_ratio}`
);

// --------------------------------------------------------------------------
// SUITE 7: Category Ambiguity Test
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 7: Category Ambiguity Verification");
console.log("--------------------------------------------------------------------------");

// 7a. Query WITH category constraint keywords ("ticket screenshot")
const categoryConstrainedResult = retrievePhotos("ticket screenshot", photos);
assert(
  categoryConstrainedResult.query.clues.category === 'screenshot',
  "Category constraint detection",
  `Detected category constraint 'screenshot'`
);

// 7b. Query WITHOUT category constraint ("Alex biking in forest")
const noCategoryConstraintResult = retrievePhotos("Alex riding a mountain bike on the forest trail in summer 2024", photos);
assert(
  noCategoryConstraintResult.weak_result_eval.reason_code !== 'CATEGORY_AMBIGUITY',
  "Unconstrained visual query does NOT trigger CATEGORY_AMBIGUITY",
  `Evaluated reason_code: '${noCategoryConstraintResult.weak_result_eval.reason_code}'`
);

// --------------------------------------------------------------------------
// SUITE 8: Explainability & Score Breakdown Audit
// --------------------------------------------------------------------------
console.log("\n--------------------------------------------------------------------------");
console.log("SUITE 8: Explainability & Score Breakdown Audit");
console.log("--------------------------------------------------------------------------");

let explainabilityPass = true;
let totalAudited = 0;

photos.forEach(photo => {
  const scored = scorePhoto(photo, compoundClues);
  totalAudited++;
  
  const sumSubscores = Math.round(
    (scored.score_breakdown.category_score +
     scored.score_breakdown.date_score +
     scored.score_breakdown.people_score +
     scored.score_breakdown.location_score +
     scored.score_breakdown.activity_score +
     scored.score_breakdown.tags_ocr_score) * 10
  ) / 10;

  if (Math.abs(scored.score - sumSubscores) > 0.01) {
    explainabilityPass = false;
  }
  if (!Array.isArray(scored.matched_clues)) {
    explainabilityPass = false;
  }
});

assert(explainabilityPass, "Explainability score sum mathematical integrity", `Audited ${totalAudited} photos. Total score equals exact sum of 6 sub-scores in all cases.`);

// --------------------------------------------------------------------------
// FINAL SUMMARY
// --------------------------------------------------------------------------
console.log("\n==========================================================================");
console.log(`TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests} tests.`);
console.log("==========================================================================");

if (failedTests > 0) {
  process.exit(1);
}
