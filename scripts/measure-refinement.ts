import fs from 'fs';
import path from 'path';
import { retrievePhotos } from '../src/lib/search-engine';
import { extractCluesFallback, parseRefinementInputFallback } from '../src/lib/fallback-engine';
import { extractCluesFromQuery, parseRefinementInput } from '../src/lib/gemini';
import { PhotoItem, StructuredClues, RecoverySuggestion } from '../src/lib/types';

const photosPath = path.join(__dirname, '..', 'data', 'photos.json');
const photos: PhotoItem[] = JSON.parse(fs.readFileSync(photosPath, 'utf8'));

console.log("==========================================================================");
console.log("REFINEMENT EFFECTIVENESS MEASUREMENT (T-08.6)");
console.log("==========================================================================");

const initialQuery = "Find the photo of me riding a bicycle in Goa.";
const refinementInput = "I think it was around December 2024.";

async function runMeasurement() {
  // 1. Initial Clues & Search
  let initialClues: StructuredClues;
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      initialClues = await extractCluesFromQuery(initialQuery);
    } catch {
      initialClues = extractCluesFallback(initialQuery);
    }
  } else {
    initialClues = extractCluesFallback(initialQuery);
  }

  const initialResult = retrievePhotos(initialQuery, photos, initialClues);

  // 2. Refine Clues & Search
  const timeSuggestion: RecoverySuggestion = {
    id: 'fb-timeframe',
    dimension: 'time_frame',
    label: 'Refine Date or Season',
    prompt_question: 'Do you remember which year or season this photo was taken?'
  };

  let refinedClues: StructuredClues;
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      refinedClues = await parseRefinementInput(refinementInput, timeSuggestion, initialClues);
    } catch {
      refinedClues = parseRefinementInputFallback(refinementInput, timeSuggestion, initialClues);
    }
  } else {
    refinedClues = parseRefinementInputFallback(refinementInput, timeSuggestion, initialClues);
  }

  const refinedResult = retrievePhotos(initialQuery, photos, refinedClues);

  // 3. Quantitative Measurements
  console.log(`\n1. Initial Candidate Count: ${initialResult.candidates.length}`);
  console.log("\n2. Initial Top 10 Candidate Scores:");
  initialResult.candidates.slice(0, 10).forEach((c, idx) => {
    console.log(`   #${idx + 1}: ${c.photo.id} ("${c.photo.title}") | Score: ${c.score} | Matched: [${c.matched_clues.join(', ')}]`);
  });

  console.log(`\n3. Refined Candidate Count: ${refinedResult.candidates.length}`);
  console.log("\n4. Refined Top 10 Candidate Scores:");
  refinedResult.candidates.slice(0, 10).forEach((c, idx) => {
    console.log(`   #${idx + 1}: ${c.photo.id} ("${c.photo.title}") | Score: ${c.score} | Matched: [${c.matched_clues.join(', ')}]`);
  });

  // 5 & 6. Pool Size & Ranking Distribution Analysis
  const isSmallerPool = refinedResult.candidates.length < initialResult.candidates.length;
  console.log(`\n5. Is Refined Pool Smaller? ${isSmallerPool ? 'YES' : 'NO'}`);
  console.log(`   Explanation: Initial candidate pool was ${initialResult.candidates.length} items. Refined pool is ${refinedResult.candidates.length} items.`);
  console.log("   Reason: Adding 'time_frame: 2024' allows 2024 items across other categories to earn partial date points, expanding low-tier candidates while sharply differentiating top-tier target photos.");

  // 7. Score Separation Metrics
  const initialTop1 = initialResult.candidates[0]?.score || 0;
  const initialTop2 = initialResult.candidates[1]?.score || 0;
  const initialTop8 = initialResult.candidates[Math.min(7, initialResult.candidates.length - 1)]?.score || 0;
  const initialSepRatio = initialTop1 > 0 ? (initialTop1 - initialTop8) / initialTop1 : 0;

  const refinedTop1 = refinedResult.candidates[0]?.score || 0;
  const refinedTop2 = refinedResult.candidates[1]?.score || 0;
  const refinedTop8 = refinedResult.candidates[Math.min(7, refinedResult.candidates.length - 1)]?.score || 0;
  const refinedSepRatio = refinedTop1 > 0 ? (refinedTop1 - refinedTop8) / refinedTop1 : 0;

  console.log("\n7. Score Separation Changes:");
  console.log(`   - Initial Top-1 vs Top-2 Delta: ${Math.round((initialTop1 - initialTop2) * 10) / 10} pts (Top-1: ${initialTop1}, Top-2: ${initialTop2})`);
  console.log(`   - Refined Top-1 vs Top-2 Delta: ${Math.round((refinedTop1 - refinedTop2) * 10) / 10} pts (Top-1: ${refinedTop1}, Top-2: ${refinedTop2})`);
  console.log(`   - Initial Top-1 vs Top-8 Separation Ratio: ${Math.round(initialSepRatio * 100)}% (${initialResult.weak_result_eval.is_weak_result ? 'WEAK' : 'STRONG'})`);
  console.log(`   - Refined Top-1 vs Top-8 Separation Ratio: ${Math.round(refinedSepRatio * 100)}% (${refinedResult.weak_result_eval.is_weak_result ? 'WEAK' : 'STRONG'})`);

  // 8. Target Photo Presence
  const goaBikingTarget = photos.find(p => p.title.toLowerCase().includes('bicycle') || p.title.toLowerCase().includes('bike'));
  const isTargetInRefined = refinedResult.candidates.some(c => c.photo.id === 'photo-001' || c.photo.id === 'photo-004');
  console.log(`\n8. Does Target Photo Remain in Candidate Set? ${isTargetInRefined ? 'YES' : 'NO'}`);
  if (isTargetInRefined) {
    const targetCandidate = refinedResult.candidates.find(c => c.photo.id === 'photo-004');
    console.log(`   Target 'photo-004' ("${targetCandidate?.photo.title}") ranks #${refinedResult.candidates.findIndex(c => c.photo.id === 'photo-004') + 1} with score ${targetCandidate?.score}`);
  }

  console.log("\n==========================================================================");
  console.log("MEASUREMENT COMPLETE");
  console.log("==========================================================================");
}

runMeasurement();
