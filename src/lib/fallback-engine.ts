/**
 * Deterministic Fallback Engine
 * Location: src/lib/fallback-engine.ts
 *
 * Provides rule-based clue extraction and recovery suggestion generation
 * when Gemini API is offline, unconfigured, or rate-limited.
 *
 * Note: Per PRD.md, fallback outputs are explicitly marked with `is_fallback_mode: true`
 * and displayed as "Basic Recovery (Offline Mode)".
 */

import { parseRawQueryToClues } from './search-engine';
import {
  StructuredClues,
  RecoverySuggestion,
  RecoveryDimension,
  ClueAnalysis,
} from './types';

/**
 * Extract clues using deterministic regex parser fallback.
 */
export function extractCluesFallback(query: string): StructuredClues {
  return parseRawQueryToClues(query);
}

/**
 * Generate default rule-based recovery suggestions when AI is offline.
 */
export function generateRecoverySuggestionsFallback(
  currentClues: StructuredClues,
  missingDimensions: RecoveryDimension[]
): ClueAnalysis {
  const knownClues: string[] = [];

  if (currentClues.category) knownClues.push(`Category: ${currentClues.category}`);
  if (currentClues.time_frame?.year) knownClues.push(`Year: ${currentClues.time_frame.year}`);
  if (currentClues.time_frame?.season) knownClues.push(`Season: ${currentClues.time_frame.season}`);
  if (currentClues.time_frame?.month) knownClues.push(`Month: ${currentClues.time_frame.month}`);
  if (currentClues.people && currentClues.people.length > 0) knownClues.push(`People: ${currentClues.people.join(', ')}`);
  if (currentClues.location?.city) knownClues.push(`City: ${currentClues.location.city}`);
  if (currentClues.activities && currentClues.activities.length > 0) knownClues.push(`Activity: ${currentClues.activities.join(', ')}`);
  if (currentClues.visual_tags && currentClues.visual_tags.length > 0) knownClues.push(`Tags: ${currentClues.visual_tags.join(', ')}`);

  const suggestions: RecoverySuggestion[] = [];

  // Suggest Category if unconstrained
  if (!currentClues.category) {
    suggestions.push({
      id: 'fb-category',
      dimension: 'category',
      label: 'Filter by Media Category',
      prompt_question: 'Was this item a regular photo, a screenshot, or a printed document?',
      suggested_value: 'screenshot',
    });
  }

  // Suggest Timeframe if unconstrained
  if (!currentClues.time_frame || (!currentClues.time_frame.year && !currentClues.time_frame.season && !currentClues.time_frame.month)) {
    suggestions.push({
      id: 'fb-timeframe',
      dimension: 'time_frame',
      label: 'Refine Date or Season',
      prompt_question: 'Do you remember which year or season this photo was taken (e.g., Summer 2024, Dec 2023)?',
    });
  }

  // Suggest People if unconstrained
  if (!currentClues.people || currentClues.people.length === 0) {
    suggestions.push({
      id: 'fb-people',
      dimension: 'people',
      label: 'Specify Person in Photo',
      prompt_question: 'Was anyone specific in the photo with you (e.g. Alex, Maya, Rohan)?',
    });
  }

  // Suggest Location if unconstrained
  if (!currentClues.location || !currentClues.location.city) {
    suggestions.push({
      id: 'fb-location',
      dimension: 'location',
      label: 'Specify Location or City',
      prompt_question: 'Where was this photo taken (e.g. Goa, Manali, Delhi, London)?',
    });
  }

  return {
    known_clues: knownClues,
    missing_dimensions: missingDimensions,
    suggestions: suggestions.slice(0, 4), // Return top 4 suggestions
    is_fallback_mode: true,
  };
}

/**
 * Merge user response into structured clues using simple rule matching when offline.
 */
export function parseRefinementInputFallback(
  userResponse: string,
  selectedSuggestion: RecoverySuggestion,
  currentClues: StructuredClues
): StructuredClues {
  const updated: StructuredClues = JSON.parse(JSON.stringify(currentClues));
  const textLower = userResponse.toLowerCase();

  switch (selectedSuggestion.dimension) {
    case 'category':
      if (textLower.includes('screenshot') || textLower.includes('ticket')) updated.category = 'screenshot';
      else if (textLower.includes('document') || textLower.includes('receipt') || textLower.includes('bill')) updated.category = 'document';
      else if (textLower.includes('photo')) updated.category = 'photo';
      break;

    case 'time_frame':
      const yearMatch = textLower.match(/\b(202[0-9])\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : (updated.time_frame?.year || null);
      
      let season = updated.time_frame?.season || null;
      if (textLower.includes('summer')) season = 'summer';
      else if (textLower.includes('winter')) season = 'winter';
      else if (textLower.includes('spring')) season = 'spring';
      else if (textLower.includes('autumn') || textLower.includes('fall')) season = 'autumn';

      let month = updated.time_frame?.month || null;
      const monthMap: Record<string, number> = {
        january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
        may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9,
        october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
      };
      Object.keys(monthMap).forEach(m => {
        if (new RegExp(`\\b${m}\\b`).test(textLower)) {
          month = monthMap[m];
        }
      });
      
      updated.time_frame = { year, season, month };
      break;

    case 'people':
      const knownPeople = ['Alex', 'Maya', 'Rohan', 'Priya', 'Vikram'];
      knownPeople.forEach(p => {
        if (textLower.includes(p.toLowerCase())) {
          if (!updated.people) updated.people = [];
          if (!updated.people.includes(p)) updated.people.push(p);
        }
      });
      break;

    case 'location':
      const knownCities = ['Goa', 'Manali', 'Delhi', 'Mumbai', 'London', 'Bali', 'Rishikesh', 'Darjeeling'];
      knownCities.forEach(c => {
        if (textLower.includes(c.toLowerCase())) {
          if (!updated.location) updated.location = {};
          updated.location.city = c;
        }
      });
      break;

    default:
      if (!updated.visual_tags) updated.visual_tags = [];
      updated.visual_tags.push(userResponse);
      break;
  }

  return updated;
}
