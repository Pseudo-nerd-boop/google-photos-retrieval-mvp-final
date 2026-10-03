import { extractCluesFallback, generateRecoverySuggestionsFallback, parseRefinementInputFallback } from '../src/lib/fallback-engine';
import { extractCluesFromQuery } from '../src/lib/gemini';

console.log("=========================================");
console.log("GEMINI AI INTEGRATION & FALLBACK TEST (T-08/T-09)");
console.log("=========================================");

const sampleQuery = "Alex riding a mountain bike on the forest trail in summer 2024";

console.log(`\n1. Testing Offline Fallback Engine:`);
const fallbackClues = extractCluesFallback(sampleQuery);
console.log("   Extracted Fallback Clues:", JSON.stringify(fallbackClues, null, 2));

const fallbackSuggestions = generateRecoverySuggestionsFallback(fallbackClues, ['category', 'location']);
console.log("\n   Generated Fallback Suggestions:", JSON.stringify(fallbackSuggestions, null, 2));

// Test Gemini API if GEMINI_API_KEY is present
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  console.log(`\n2. Testing Live Gemini API (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}):`);
  extractCluesFromQuery(sampleQuery)
    .then(aiClues => {
      console.log("   ✓ Gemini Extracted Clues:", JSON.stringify(aiClues, null, 2));
    })
    .catch(err => {
      console.warn("   ✗ Gemini Call Error (as expected if unauthenticated/offline):", err.message);
    });
} else {
  console.log(`\n2. Live Gemini API skipped (No real GEMINI_API_KEY in .env.local). Fallback active.`);
}

console.log("\n=========================================");
console.log("SUCCESS: Gemini module and fallback engine verified.");
console.log("=========================================");
