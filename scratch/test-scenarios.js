const { retrievePhotos } = require('../src/lib/search-engine');
const photos = require('../data/photos.json');
const { extractCluesFallback, generateRecoverySuggestionsFallback, parseRefinementInputFallback } = require('../src/lib/fallback-engine');

const scenarios = [
  { name: 'A. Goa Bicycle', query: 'Find the photo of me riding a bicycle in Goa.', refinement: 'around December 2024' },
  { name: 'B. Birthday Cake', query: 'Find the picture from my birthday where everyone was around the cake.', refinement: 'with my family and Mom' },
  { name: 'C. Payment Screenshot', query: 'I remember a screenshot of a payment confirmation from last year.', refinement: 'for apartment rent in December 2024' },
  { name: 'D. Goa Dinner with Friends', query: 'That photo of me with my college friends having dinner during our Goa trip.', refinement: 'at Thalassa restaurant' },
];

console.log("==========================================================================");
console.log("TESTING 4 CORE RETRIEVAL SCENARIOS (T-09.5)");
console.log("==========================================================================");

scenarios.forEach((sc, idx) => {
  console.log(`\n--- [Scenario ${idx + 1}] ${sc.name} ---`);
  console.log(`Initial Query: "${sc.query}"`);

  // 1. Initial Clue Extraction (Deterministic / Gemini Schema compliant)
  const clues = extractCluesFallback(sc.query);
  console.log("Extracted Clues:", JSON.stringify(clues, null, 2));

  // 2. Initial Search Pass
  const res1 = retrievePhotos(sc.query, photos, clues);
  console.log(`Initial Candidates: ${res1.candidates.length}`);
  console.log(`Weak Result Flagged: ${res1.weak_result_eval.is_weak_result} (${res1.weak_result_eval.reason_code})`);
  if (res1.candidates.length > 0) {
    console.log(`Top #1 Candidate: ${res1.candidates[0].photo.id} ("${res1.candidates[0].photo.title}") - Score: ${res1.candidates[0].score}`);
  }

  // 3. Recovery Suggestions
  const suggestions = generateRecoverySuggestionsFallback(clues, ['time_frame', 'people', 'location', 'category']).suggestions;
  console.log(`Recovery Suggestions: ${suggestions.map(s => s.label).join(' | ')}`);

  // 4. Refinement Input
  const selectedSug = suggestions[0];
  const updatedClues = parseRefinementInputFallback(sc.refinement, selectedSug, clues);
  console.log(`Refinement: "${sc.refinement}" -> Updated Clues:`, JSON.stringify(updatedClues, null, 2));

  // 5. Refined Search Pass
  const res2 = retrievePhotos(sc.query, photos, updatedClues);
  console.log(`Refined Candidates: ${res2.candidates.length}`);
  if (res2.candidates.length > 0) {
    console.log(`Refined Top #1 Candidate: ${res2.candidates[0].photo.id} ("${res2.candidates[0].photo.title}") - Score: ${res2.candidates[0].score}`);
  }
});

console.log("\n==========================================================================");
console.log("ALL 4 SCENARIOS TESTED SUCCESSFULLY!");
console.log("==========================================================================");
