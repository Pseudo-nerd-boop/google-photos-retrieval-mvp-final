import { NextRequest, NextResponse } from 'next/server';
import { extractCluesFromQuery, generateRecoverySuggestions, parseRefinementInput } from '../../../lib/gemini';
import { extractCluesFallback, generateRecoverySuggestionsFallback, parseRefinementInputFallback } from '../../../lib/fallback-engine';
import { StructuredClues, RecoverySuggestion, RecoveryDimension } from '../../../lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, query, currentClues, selectedSuggestion, userResponse, missingDimensions, candidateContext } = body;

    // 1. Initial Clue Extraction Action
    if (action === 'EXTRACT_CLUES') {
      if (!query) {
        return NextResponse.json({ error: 'Query is required for clue extraction' }, { status: 400 });
      }

      try {
        const extracted = await extractCluesFromQuery(query);
        return NextResponse.json({ clues: extracted, is_fallback_mode: false });
      } catch (aiErr) {
        console.warn('[Recovery API] Gemini API unavailable, using fallback parser:', aiErr);
        const fallbackClues = extractCluesFallback(query);
        return NextResponse.json({ clues: fallbackClues, is_fallback_mode: true });
      }
    }

    // 2. Generate Next-Step Recovery Suggestions
    if (action === 'GENERATE_SUGGESTIONS') {
      const dimensions: RecoveryDimension[] = missingDimensions || ['category', 'time_frame', 'people', 'location'];
      const clues: StructuredClues = currentClues || {};

      try {
        const suggestions = await generateRecoverySuggestions(clues, dimensions, candidateContext);
        return NextResponse.json({
          suggestions,
          is_fallback_mode: false,
        });
      } catch (aiErr) {
        console.warn('[Recovery API] Gemini API unavailable, using fallback suggestions:', aiErr);
        const fallbackAnalysis = generateRecoverySuggestionsFallback(clues, dimensions);
        return NextResponse.json(fallbackAnalysis);
      }
    }

    // 3. Process Refinement User Input
    if (action === 'PROCESS_REFINEMENT') {
      if (!userResponse || !selectedSuggestion) {
        return NextResponse.json({ error: 'userResponse and selectedSuggestion are required' }, { status: 400 });
      }

      try {
        const updatedClues = await parseRefinementInput(userResponse, selectedSuggestion, currentClues);
        return NextResponse.json({ clues: updatedClues, is_fallback_mode: false });
      } catch (aiErr) {
        console.warn('[Recovery API] Gemini API unavailable, using fallback refinement:', aiErr);
        const updatedClues = parseRefinementInputFallback(userResponse, selectedSuggestion, currentClues);
        return NextResponse.json({ clues: updatedClues, is_fallback_mode: true });
      }
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Recovery operation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
