/**
 * Transparent Deterministic Retrieval & Scoring Engine
 * Location: src/lib/search-engine.ts
 */

import {
  PhotoItem,
  StructuredClues,
  SearchQuery,
  ScoreBreakdown,
  ScoredPhotoItem,
  WeakResultEvaluation,
  SearchResult,
  PhotoCategory,
  Season,
} from './types';

// Default scoring weights as specified in PRD.md
const WEIGHTS = {
  CATEGORY: 30,
  DATE: 25,
  PEOPLE: 20,
  LOCATION: 15,
  ACTIVITY: 10,
  TAGS_OCR: 10,
};

/**
 * Keywords that strongly imply a specific media-category constraint.
 */
const CATEGORY_HINT_KEYWORDS = [
  'screenshot', 'ticket', 'boarding pass', 'pass', 'receipt',
  'bill', 'invoice', 'document', 'menu', 'flyer', 'note', 'confirmation'
];

/**
 * Deterministic keyword parser to extract structured clues from raw text
 * when AI clue extraction is not active or during direct search testing.
 */
export function parseRawQueryToClues(rawQuery: string): StructuredClues {
  const queryLower = rawQuery.toLowerCase();
  const clues: StructuredClues = {
    category: null,
    time_frame: null,
    people: [],
    location: null,
    activities: [],
    objects: [],
    event: null,
    visual_tags: [],
    ocr_text: null,
  };

  // 1. Category hints
  if (queryLower.includes('screenshot') || queryLower.includes('ticket') || queryLower.includes('boarding pass') || queryLower.includes('pass')) {
    clues.category = 'screenshot';
  } else if (queryLower.includes('receipt') || queryLower.includes('bill') || queryLower.includes('invoice') || queryLower.includes('document')) {
    clues.category = 'document';
  } else if (queryLower.includes('photo') || queryLower.includes('picture')) {
    clues.category = 'photo';
  }

  // 2. Year, Season, Month hints
  const yearMatch = queryLower.match(/\b(202[0-9])\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  let season: Season | null = null;
  if (queryLower.includes('summer')) season = 'summer';
  else if (queryLower.includes('winter')) season = 'winter';
  else if (queryLower.includes('spring')) season = 'spring';
  else if (queryLower.includes('autumn') || queryLower.includes('fall')) season = 'autumn';

  let month: number | null = null;
  const monthMap: Record<string, number> = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
    may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9,
    october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  };
  Object.keys(monthMap).forEach(m => {
    if (new RegExp(`\\b${m}\\b`).test(queryLower)) {
      month = monthMap[m];
    }
  });

  if (year || season || month) {
    clues.time_frame = { year, season, month };
  }

  // 3. Known People & Owner Self Concept
  const knownPeople = ['Alex', 'Maya', 'Rohan', 'Priya', 'Vikram', 'Ananya', 'Rahul', 'Siddharth', 'Aman', 'Sarah', 'David'];
  knownPeople.forEach(person => {
    if (new RegExp(`\\b${person.toLowerCase()}\\b`).test(queryLower)) {
      if (!clues.people) clues.people = [];
      clues.people.push(person);
    }
  });

  if (/\b(me|myself|you|my|self)\b/.test(queryLower)) {
    if (!clues.people) clues.people = [];
    if (!clues.people.includes('me')) clues.people.push('me');
  }

  // 4. Locations
  const knownCities = ['Goa', 'Manali', 'Delhi', 'Mumbai', 'London', 'Bali', 'Rishikesh', 'Darjeeling', 'Bengaluru', 'Jaipur'];
  knownCities.forEach(city => {
    if (new RegExp(`\\b${city.toLowerCase()}\\b`).test(queryLower)) {
      if (!clues.location) clues.location = {};
      clues.location.city = city;
    }
  });

  // 5. Activities & Visual Tags Keywords
  const tagKeywords = [
    'mountain bike', 'bicycle', 'bike', 'biking', 'cycling', 'riding', 'trail', 'forest',
    'sunset', 'sunrise', 'beach', 'ocean', 'sea', 'waves',
    'campfire', 'guitar', 'acoustic guitar', 'singing', 'tent', 'camping',
    'concert', 'coldplay', 'ticket', 'flight', 'receipt', 'swiggy', 'coffee',
    'hiking', 'volleyball', 'pizza', 'birthday', 'dog', 'snow'
  ];

  tagKeywords.forEach(tag => {
    if (queryLower.includes(tag)) {
      if (tag.includes('bike') || tag.includes('bicycle') || tag.includes('riding') || tag.includes('hiking') || tag.includes('singing') || tag.includes('camping')) {
        if (!clues.activities) clues.activities = [];
        if (!clues.activities.includes(tag)) clues.activities.push(tag);
      } else {
        if (!clues.visual_tags) clues.visual_tags = [];
        if (!clues.visual_tags.includes(tag)) clues.visual_tags.push(tag);
      }
    }
  });

  return clues;
}

/**
 * Score a single photo against structured retrieval clues
 * using transparent, explainable metadata matching.
 */
export function scorePhoto(photo: PhotoItem, clues: StructuredClues): ScoredPhotoItem {
  let categoryScore = 0;
  let dateScore = 0;
  let peopleScore = 0;
  let locationScore = 0;
  let activityScore = 0;
  let tagsOcrScore = 0;

  const matchedClues: string[] = [];

  // 1. Category Score (Max 30)
  if (clues.category) {
    if (photo.category === clues.category) {
      categoryScore = WEIGHTS.CATEGORY;
      matchedClues.push(`Category: ${photo.category}`);
    } else if (
      (clues.category === 'screenshot' && photo.category === 'document') ||
      (clues.category === 'document' && photo.category === 'screenshot')
    ) {
      categoryScore = WEIGHTS.CATEGORY * 0.4; // Partial credit for related digital media
      matchedClues.push(`Partial Category Match: ${photo.category}`);
    }
  }

  // 2. Date / Timeframe Score (Max 25)
  if (clues.time_frame) {
    const { year, season, month } = clues.time_frame;
    let timeMatches = 0;
    let timeTotal = 0;

    if (year !== undefined && year !== null) {
      timeTotal++;
      if (photo.year === year) timeMatches++;
    }
    if (season !== undefined && season !== null) {
      timeTotal++;
      if (photo.season === season) timeMatches++;
    }
    if (month !== undefined && month !== null) {
      timeTotal++;
      if (photo.month === month) timeMatches++;
    }

    if (timeTotal > 0 && timeMatches > 0) {
      dateScore = (timeMatches / timeTotal) * WEIGHTS.DATE;
      matchedClues.push(`Timeframe (${timeMatches}/${timeTotal} matches)`);
    }
  }

  // 3. People Score (Max 20)
  if (clues.people && clues.people.length > 0) {
    const photoPeopleLower = photo.people.map(p => p.toLowerCase());
    let peopleMatches = 0;
    const selfTerms = new Set(['me', 'myself', 'you', 'my', 'self', 'owner', 'alex']);

    clues.people.forEach(person => {
      const pLower = person.toLowerCase();
      const isQuerySelf = selfTerms.has(pLower);

      let matched = false;
      for (const photoPerson of photoPeopleLower) {
        const isPhotoSelf = selfTerms.has(photoPerson);
        if ((isQuerySelf && isPhotoSelf) || photoPerson === pLower) {
          matched = true;
          break;
        }
      }

      if (matched) {
        peopleMatches++;
        const displayLabel = isQuerySelf ? 'You (self)' : person;
        matchedClues.push(`Person: ${displayLabel}`);
      }
    });

    if (peopleMatches > 0) {
      peopleScore = Math.min(1, peopleMatches / clues.people.length) * WEIGHTS.PEOPLE;
    }
  }

  // 4. Location & Setting Score (Max 15)
  if (clues.location) {
    let locScoreRatio = 0;
    const { city, name, country, setting } = clues.location;

    if (city && photo.location.city.toLowerCase().includes(city.toLowerCase())) {
      locScoreRatio += 0.5;
      matchedClues.push(`City: ${photo.location.city}`);
    }
    if (name && (photo.location.name.toLowerCase().includes(name.toLowerCase()) || photo.title.toLowerCase().includes(name.toLowerCase()))) {
      locScoreRatio += 0.3;
      matchedClues.push(`Location: ${photo.location.name}`);
    }
    if (country && photo.location.country.toLowerCase() === country.toLowerCase()) {
      locScoreRatio += 0.1;
    }
    if (setting && photo.location.setting === setting) {
      locScoreRatio += 0.1;
      matchedClues.push(`Setting: ${setting}`);
    }

    locationScore = Math.min(1, locScoreRatio) * WEIGHTS.LOCATION;
  }

  // 5. Activity Score (Max 10)
  if (clues.activities && clues.activities.length > 0) {
    const photoActLower = photo.activities.map(a => a.toLowerCase()).join(' ');
    let actMatches = 0;

    clues.activities.forEach(act => {
      if (photoActLower.includes(act.toLowerCase()) || photo.title.toLowerCase().includes(act.toLowerCase())) {
        actMatches++;
        matchedClues.push(`Activity: ${act}`);
      }
    });

    if (actMatches > 0) {
      activityScore = Math.min(1, actMatches / clues.activities.length) * WEIGHTS.ACTIVITY;
    }
  }

  // 6. Visual Tags, Objects, Event & OCR Text Score (Max 10)
  const queryTags = [
    ...(clues.visual_tags || []),
    ...(clues.objects || []),
    ...(clues.event ? [clues.event] : []),
    ...(clues.ocr_text ? [clues.ocr_text] : []),
  ];

  if (queryTags.length > 0) {
    const photoTextBlob = [
      ...photo.visual_tags,
      ...photo.objects,
      photo.event,
      photo.title,
      photo.description,
      photo.ocr_text,
    ].join(' ').toLowerCase();

    let tagMatches = 0;
    queryTags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (photoTextBlob.includes(tagLower)) {
        tagMatches++;
        matchedClues.push(`Keyword/Tag: ${tag}`);
      }
    });

    if (tagMatches > 0) {
      tagsOcrScore = Math.min(1, tagMatches / Math.max(1, queryTags.length)) * WEIGHTS.TAGS_OCR;
    }
  }

  const scoreBreakdown: ScoreBreakdown = {
    category_score: Math.round(categoryScore * 10) / 10,
    date_score: Math.round(dateScore * 10) / 10,
    people_score: Math.round(peopleScore * 10) / 10,
    location_score: Math.round(locationScore * 10) / 10,
    activity_score: Math.round(activityScore * 10) / 10,
    tags_ocr_score: Math.round(tagsOcrScore * 10) / 10,
    total_score: 0,
  };

  const totalScore = Math.round(
    (categoryScore + dateScore + peopleScore + locationScore + activityScore + tagsOcrScore) * 10
  ) / 10;
  
  scoreBreakdown.total_score = totalScore;

  return {
    photo,
    score: totalScore,
    score_breakdown: scoreBreakdown,
    matched_clues: Array.from(new Set(matchedClues)),
  };
}

/**
 * Deterministically evaluate whether a result set is "Weak / Broad"
 * following the prototype rules defined in PRD.md.
 */
export function evaluateWeakResults(
  candidates: ScoredPhotoItem[],
  clues: StructuredClues,
  rawQuery: string = ''
): WeakResultEvaluation {
  const totalCount = candidates.length;

  // Rule 3: Zero Matches
  if (totalCount === 0 || (candidates[0] && candidates[0].score === 0)) {
    return {
      is_weak_result: true,
      reason_code: 'ZERO_MATCHES',
      explanation: 'No photo records matched your memory clues in the dataset.',
      total_candidates: totalCount,
      top_score: 0,
      score_separation_ratio: 0,
    };
  }

  const topScore = candidates[0].score;

  // Rule 1: High Count with Low Score Separation (> 8 items, top 8 score delta < 15%)
  if (totalCount > 8) {
    const eighthScore = candidates[Math.min(7, totalCount - 1)].score;
    const separationRatio = topScore > 0 ? (topScore - eighthScore) / topScore : 0;

    if (separationRatio < 0.15) {
      return {
        is_weak_result: true,
        reason_code: 'HIGH_COUNT_LOW_SEPARATION',
        explanation: `Returned ${totalCount} candidate photos, but the top results have very similar scores (${Math.round(separationRatio * 100)}% score separation). The search results are broad and noisy.`,
        total_candidates: totalCount,
        top_score: topScore,
        score_separation_ratio: Math.round(separationRatio * 100) / 100,
      };
    }
  }

  // Rule 2: Low Query Clue Coverage (Expressed >= 2 clues, but top result matches < 50% score potential)
  let expressedClueCount = 0;
  if (clues.category) expressedClueCount++;
  if (clues.time_frame && (clues.time_frame.year || clues.time_frame.season || clues.time_frame.month)) expressedClueCount++;
  if (clues.people && clues.people.length > 0) expressedClueCount++;
  if (clues.location && (clues.location.city || clues.location.name)) expressedClueCount++;
  if (clues.activities && clues.activities.length > 0) expressedClueCount++;
  if ((clues.visual_tags && clues.visual_tags.length > 0) || clues.event || clues.ocr_text) expressedClueCount++;

  const topMatchedCluesCount = candidates[0].matched_clues.length;
  if (expressedClueCount >= 2 && topMatchedCluesCount < Math.ceil(expressedClueCount * 0.5)) {
    return {
      is_weak_result: true,
      reason_code: 'LOW_CLUE_COVERAGE',
      explanation: `You specified ${expressedClueCount} memory clues, but the top result only matched ${topMatchedCluesCount} clue(s).`,
      total_candidates: totalCount,
      top_score: topScore,
      score_separation_ratio: 1,
    };
  }

  // Rule 4: Category Ambiguity
  // Only trigger when query explicitly expresses or strongly implies a media-category constraint
  // AND top candidate results returned are ambiguous across media categories.
  const queryLower = rawQuery.toLowerCase();
  const hasCategoryConstraint = Boolean(clues.category) || CATEGORY_HINT_KEYWORDS.some(k => queryLower.includes(k));

  if (hasCategoryConstraint && candidates.length >= 2) {
    const topCategories = new Set(candidates.slice(0, 5).map(c => c.photo.category));
    if (topCategories.size > 1 && (topCategories.has('photo') && (topCategories.has('screenshot') || topCategories.has('document')))) {
      return {
        is_weak_result: true,
        reason_code: 'CATEGORY_AMBIGUITY',
        explanation: 'Query implies a media-type constraint, but top results contain a mix of photos, screenshots, and documents.',
        total_candidates: totalCount,
        top_score: topScore,
        score_separation_ratio: 1,
      };
    }
  }

  // No weak result condition triggered
  return {
    is_weak_result: false,
    reason_code: 'NONE',
    explanation: 'Initial search returned clear, high-confidence results.',
    total_candidates: totalCount,
    top_score: topScore,
    score_separation_ratio: totalCount > 1 ? (topScore - candidates[Math.min(1, totalCount - 1)].score) / topScore : 1,
  };
}

/**
 * Execute a complete deterministic retrieval pass against the dataset.
 */
export function retrievePhotos(
  queryInput: SearchQuery | string,
  photos: PhotoItem[],
  overrideClues?: StructuredClues
): SearchResult {
  const startTime = Date.now();

  let query: SearchQuery;
  if (typeof queryInput === 'string') {
    const parsedClues = overrideClues || parseRawQueryToClues(queryInput);
    query = { raw_query: queryInput, clues: parsedClues };
  } else {
    query = {
      raw_query: queryInput.raw_query,
      clues: overrideClues || queryInput.clues,
    };
  }

  // Score all photos
  const scored = photos.map(photo => scorePhoto(photo, query.clues));
  let candidates = scored.sort((a, b) => b.score - a.score);
  const highestScore = candidates[0]?.score || 0;

  if (highestScore > 0) {
    // Determine whether non-date retrieval clues are present in the query
    const hasNonDateClues = Boolean(
      query.clues.category ||
      (query.clues.people && query.clues.people.length > 0) ||
      (query.clues.location && (query.clues.location.city || query.clues.location.name || query.clues.location.country || query.clues.location.setting)) ||
      (query.clues.activities && query.clues.activities.length > 0) ||
      (query.clues.objects && query.clues.objects.length > 0) ||
      (query.clues.visual_tags && query.clues.visual_tags.length > 0) ||
      query.clues.event ||
      query.clues.ocr_text
    );

    // Hybrid Significance Threshold: candidates must reach at least 20% of highest score
    const minScoreThreshold = 0.20 * highestScore;

    candidates = candidates.filter(item => {
      // 1. Must have positive score
      if (item.score <= 0) return false;

      // 2. Must meet significance threshold relative to top score
      if (item.score < minScoreThreshold) return false;

      // 3. When non-date clues are present, candidate must match at least one non-date dimension
      if (hasNonDateClues) {
        const hasNonDateMatch = item.matched_clues.some(clue => !clue.startsWith('Timeframe'));
        if (!hasNonDateMatch) return false;
      }

      return true;
    });
  }

  // Evaluate weak result condition
  const weakEval = evaluateWeakResults(candidates, query.clues, query.raw_query);
  const executionTime = Date.now() - startTime;

  return {
    query,
    candidates,
    weak_result_eval: weakEval,
    execution_time_ms: executionTime,
  };
}
