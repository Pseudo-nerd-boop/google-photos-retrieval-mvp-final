/**
 * Gemini AI Integration Module
 * Location: src/lib/gemini.ts
 *
 * Server-side wrapper around @google/genai for natural-language clue extraction,
 * missing dimension reasoning, and contextual recovery suggestion generation.
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  StructuredClues,
  RecoverySuggestion,
  RecoveryDimension,
} from './types';

// Helper functions for dynamic environment resolution
function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function getModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.6-flash';
}

/**
 * System prompt for initial memory clue extraction.
 */
const EXTRACTION_SYSTEM_PROMPT = `You are a retrieval-clue extraction system for a photo search engine.

Your job is to convert a user's natural-language memory into structured retrieval clues.

Extract only clues explicitly stated or strongly implied by the user's description.

Do not invent:
- dates
- people
- locations
- activities
- categories
- objects
- OCR text

A missing clue must remain missing.

Return ONLY valid JSON matching the supplied retrieval schema.
The output will be passed directly into an existing deterministic retrieval engine, so do not include explanations, markdown, or additional fields.`;

/**
 * System prompt for generating recovery suggestions.
 */
const RECOVERY_SUGGESTION_SYSTEM_PROMPT = `You are a context-aware photo search recovery assistant.

The user's initial search query yielded broad, noisy, or unhelpful results.
Analyze the current known memory clues and missing retrieval dimensions to generate 2 to 4 targeted, actionable refinement suggestions.

For each suggestion:
- Pick a missing dimension (e.g. category, time_frame, people, location, activities, objects, ocr_text).
- Provide a clear, concise label (e.g. "Filter by Category: Screenshot", "Refine Date: Season or Year").
- Provide a natural follow-up prompt question for the user (e.g. "Was this a screenshot, printed document, or regular photo?").

Return ONLY valid JSON matching the supplied response schema. No explanations or markdown.`;

/**
 * Structured schema for clue extraction response.
 */
const structuredCluesSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, nullable: true },
    time_frame: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        year: { type: Type.INTEGER, nullable: true },
        month: { type: Type.INTEGER, nullable: true },
        season: { type: Type.STRING, nullable: true },
      },
    },
    people: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
    },
    location: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        name: { type: Type.STRING, nullable: true },
        city: { type: Type.STRING, nullable: true },
        country: { type: Type.STRING, nullable: true },
        setting: { type: Type.STRING, nullable: true },
      },
    },
    activities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
    },
    objects: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
    },
    event: { type: Type.STRING, nullable: true },
    visual_tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
    },
    ocr_text: { type: Type.STRING, nullable: true },
  },
};

/**
 * Schema for array of recovery suggestions.
 */
const recoverySuggestionsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      dimension: { type: Type.STRING },
      label: { type: Type.STRING },
      prompt_question: { type: Type.STRING },
      suggested_value: { type: Type.STRING, nullable: true },
    },
    required: ['id', 'dimension', 'label', 'prompt_question'],
  },
};

/**
 * Helper to get an initialized GoogleGenAI instance.
 */
function getAiClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Extract structured clues from a raw natural-language memory query string using Gemini API.
 */
export async function extractCluesFromQuery(query: string): Promise<StructuredClues> {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: [
      { role: 'user', parts: [{ text: query }] }
    ],
    config: {
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: structuredCluesSchema,
      temperature: 0.1,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  const parsed = JSON.parse(text) as StructuredClues;
  return sanitizeClues(parsed);
}

/**
 * Generate 2 to 4 context-aware recovery path suggestions based on current clues and missing dimensions.
 */
export async function generateRecoverySuggestions(
  currentClues: StructuredClues,
  missingDimensions: RecoveryDimension[],
  candidateContext: string = ''
): Promise<RecoverySuggestion[]> {
  const ai = getAiClient();

  const userPrompt = `Current Known Clues: ${JSON.stringify(currentClues)}
Unconstrained Missing Dimensions: ${missingDimensions.join(', ')}
${candidateContext ? `Candidate Result Context: ${candidateContext}` : ''}

Generate 2 to 4 actionable recovery suggestions matching the missing dimensions.`;

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: RECOVERY_SUGGESTION_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: recoverySuggestionsSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini API returned an empty suggestions response.');
  }

  return JSON.parse(text) as RecoverySuggestion[];
}

/**
 * Convert user's natural-language response to a refinement suggestion into updated structured clues.
 */
export async function parseRefinementInput(
  userResponse: string,
  selectedSuggestion: RecoverySuggestion,
  currentClues: StructuredClues
): Promise<StructuredClues> {
  const ai = getAiClient();

  const prompt = `Current Clues: ${JSON.stringify(currentClues)}
Selected Refinement Path: ${selectedSuggestion.label} (Dimension: ${selectedSuggestion.dimension})
User Input Detail: "${userResponse}"

Update the structured clues by merging the new user input for the dimension '${selectedSuggestion.dimension}'.
Maintain all previously known clues that are not overwritten.`;

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: structuredCluesSchema,
      temperature: 0.1,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini API returned empty refinement response.');
  }

  const updated = JSON.parse(text) as StructuredClues;
  return sanitizeClues(updated);
}

/**
 * Clean up null/undefined fields to keep clues clean.
 */
function sanitizeClues(clues: Partial<StructuredClues>): StructuredClues {
  return {
    category: clues.category || null,
    time_frame: clues.time_frame ? {
      year: clues.time_frame.year || null,
      month: clues.time_frame.month || null,
      season: clues.time_frame.season || null,
    } : null,
    people: Array.isArray(clues.people) ? clues.people : [],
    location: clues.location ? {
      name: clues.location.name || null,
      city: clues.location.city || null,
      country: clues.location.country || null,
      setting: clues.location.setting || null,
    } : null,
    activities: Array.isArray(clues.activities) ? clues.activities : [],
    objects: Array.isArray(clues.objects) ? clues.objects : [],
    event: clues.event || null,
    visual_tags: Array.isArray(clues.visual_tags) ? clues.visual_tags : [],
    ocr_text: clues.ocr_text || null,
  };
}
