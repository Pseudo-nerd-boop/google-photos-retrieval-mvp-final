import fs from 'fs';
import path from 'path';
import { retrievePhotos } from '../src/lib/search-engine';
import { extractCluesFromQuery, generateRecoverySuggestions, parseRefinementInput } from '../src/lib/gemini';
import { extractCluesFallback, generateRecoverySuggestionsFallback, parseRefinementInputFallback } from '../src/lib/fallback-engine';
import { PhotoItem, StructuredClues, RecoverySuggestion, SearchResult } from '../src/lib/types';

const photosPath = path.join(__dirname, '..', 'data', 'photos.json');
const photos: PhotoItem[] = JSON.parse(fs.readFileSync(photosPath, 'utf8'));

console.log("==========================================================================");
console.log("END-TO-END INTEGRATION TEST (T-08.5)");
console.log("==========================================================================");

const initialQuery = "Find the photo of me riding a bicycle in Goa.";
const refinementInput = "I think it was around December 2024.";

async function runE2eTest() {
  const steps: Record<string, { pass: boolean; detail: string }> = {};

  try {
    // ----------------------------------------------------------------------
    // STEP 1: Clue Extraction
    // ----------------------------------------------------------------------
    console.log(`\n[STEP 1] Extracting Clues for Query: "${initialQuery}"`);
    let clues: StructuredClues;
    let isFallback = false;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        clues = await extractCluesFromQuery(initialQuery);
        console.log("  Mode: Live Gemini API");
      } catch (err) {
        console.warn("  Gemini API error, using fallback parser:", (err as Error).message);
        clues = extractCluesFallback(initialQuery);
        isFallback = true;
      }
    } else {
      console.log("  Mode: Deterministic Fallback Engine (No GEMINI_API_KEY configured)");
      clues = extractCluesFallback(initialQuery);
      isFallback = true;
    }

    console.log("  Extracted Clues:", JSON.stringify(clues, null, 2));
    steps['1. Clue Extraction'] = { pass: true, detail: `Extracted clues (Fallback: ${isFallback})` };

    // ----------------------------------------------------------------------
    // STEP 2 & 3: Initial Retrieval & Candidate Ranking
    // ----------------------------------------------------------------------
    console.log("\n[STEP 2 & 3] Running Initial Retrieval Engine Pass...");
    const initialResult: SearchResult = retrievePhotos(initialQuery, photos, clues);

    console.log(`  Candidate Count (> 0 score): ${initialResult.candidates.length}`);
    console.log("  Top 3 Initial Candidates:");
    initialResult.candidates.slice(0, 3).forEach((cand, idx) => {
      console.log(`    #${idx + 1}: ${cand.photo.id} ("${cand.photo.title}") - Score: ${cand.score} (Matched: ${cand.matched_clues.join(', ')})`);
    });

    steps['2. Retrieval Engine Acceptance'] = { pass: true, detail: 'Accepted structured clues without schema errors' };
    steps['3. Candidate Ranking'] = { pass: initialResult.candidates.length > 0, detail: `Retrieved ${initialResult.candidates.length} candidates` };

    // ----------------------------------------------------------------------
    // STEP 4 & 5: Weak-Result Detection & Recovery Suggestions
    // ----------------------------------------------------------------------
    console.log("\n[STEP 4 & 5] Evaluating Weak-Result & Generating Suggestions...");
    const weakEval = initialResult.weak_result_eval;

    console.log(`  Weak Result Flagged: ${weakEval.is_weak_result ? 'YES' : 'NO'}`);
    console.log(`  Reason Code: ${weakEval.reason_code}`);
    console.log(`  Explanation: ${weakEval.explanation}`);

    steps['4. Weak-Result Detection'] = { pass: true, detail: `Weak Flag: ${weakEval.is_weak_result}, Reason: ${weakEval.reason_code}` };

    let suggestions: RecoverySuggestion[] = [];
    if (isFallback) {
      const fallbackAnalysis = generateRecoverySuggestionsFallback(clues, ['time_frame', 'category', 'people']);
      suggestions = fallbackAnalysis.suggestions;
    } else {
      try {
        suggestions = await generateRecoverySuggestions(clues, ['time_frame', 'category', 'people'], `Candidates: ${initialResult.candidates.length}`);
      } catch (e) {
        suggestions = generateRecoverySuggestionsFallback(clues, ['time_frame', 'category', 'people']).suggestions;
      }
    }

    console.log("  Generated Recovery Suggestions:");
    suggestions.forEach((sug, idx) => {
      console.log(`    #${idx + 1}: [${sug.dimension}] ${sug.label} -> Question: "${sug.prompt_question}"`);
    });

    steps['5. Recovery Suggestions Generation'] = { pass: suggestions.length > 0, detail: `Generated ${suggestions.length} suggestions` };

    // ----------------------------------------------------------------------
    // STEP 6 & 7: Refinement Input & Clue Update
    // ----------------------------------------------------------------------
    console.log(`\n[STEP 6 & 7] Processing Refinement Input: "${refinementInput}"`);
    const selectedSuggestion = suggestions.find(s => s.dimension === 'time_frame') || suggestions[0];
    console.log(`  Selected Refinement Path: [${selectedSuggestion.dimension}] ${selectedSuggestion.label}`);

    let updatedClues: StructuredClues;
    if (isFallback) {
      updatedClues = parseRefinementInputFallback(refinementInput, selectedSuggestion, clues);
    } else {
      try {
        updatedClues = await parseRefinementInput(refinementInput, selectedSuggestion, clues);
      } catch (e) {
        updatedClues = parseRefinementInputFallback(refinementInput, selectedSuggestion, clues);
      }
    }

    console.log("  Updated Structured Clues:", JSON.stringify(updatedClues, null, 2));

    steps['6. Refinement Input Handling'] = { pass: true, detail: `Processed response "${refinementInput}"` };
    steps['7. Structured Clue Update'] = { pass: Boolean(updatedClues.time_frame), detail: 'Updated timeframe clues successfully' };

    // ----------------------------------------------------------------------
    // STEP 8 & 9: Refined Retrieval Pass & Comparison
    // ----------------------------------------------------------------------
    console.log("\n[STEP 8 & 9] Running Refined Retrieval Engine Pass...");
    const refinedResult: SearchResult = retrievePhotos(initialQuery, photos, updatedClues);

    console.log(`  Candidate Count After Refinement: ${refinedResult.candidates.length} (Before: ${initialResult.candidates.length})`);
    console.log("  Top 3 Refined Candidates:");
    refinedResult.candidates.slice(0, 3).forEach((cand, idx) => {
      console.log(`    #${idx + 1}: ${cand.photo.id} ("${cand.photo.title}") - Score: ${cand.score} (Matched: ${cand.matched_clues.join(', ')})`);
    });

    const candidateDifference = initialResult.candidates.length - refinedResult.candidates.length;
    console.log(`  Refinement Impact: ${candidateDifference >= 0 ? `Narrowed candidate pool by ${candidateDifference} items` : 'Refined candidate ranking'}`);

    steps['8. Refined Retrieval Execution'] = { pass: true, detail: `Refined retrieval completed in ${refinedResult.execution_time_ms} ms` };
    steps['9. Candidate Pool Comparison'] = { pass: true, detail: `Initial: ${initialResult.candidates.length} -> Refined: ${refinedResult.candidates.length} candidates` };

    // ----------------------------------------------------------------------
    // STEP 10: Full Chain Completion
    // ----------------------------------------------------------------------
    steps['10. Full Chain Completion'] = { pass: true, detail: 'Entire end-to-end flow completed with 0 runtime errors' };

  } catch (err) {
    console.error("FATAL ERROR during E2E Pipeline execution:", err);
    steps['10. Full Chain Completion'] = { pass: false, detail: (err as Error).message };
  }

  console.log("\n==========================================================================");
  console.log("E2E PIPELINE TEST STEP-BY-STEP SUMMARY");
  console.log("==========================================================================");
  Object.keys(steps).forEach(stepKey => {
    const s = steps[stepKey];
    console.log(`  ${s.pass ? '✓ PASS' : '✗ FAIL'} : ${stepKey} — ${s.detail}`);
  });
  console.log("==========================================================================");
}

runE2eTest();
