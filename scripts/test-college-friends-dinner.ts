import fs from 'fs';
import path from 'path';
import { retrievePhotos, scorePhoto } from '../src/lib/search-engine';
import { PhotoItem, StructuredClues } from '../src/lib/types';
import { extractCluesFallback } from '../src/lib/fallback-engine';

const photosPath = path.join(__dirname, '..', 'data', 'photos.json');
const photos: PhotoItem[] = JSON.parse(fs.readFileSync(photosPath, 'utf8'));

console.log("==========================================================================");
console.log("COLLEGE FRIENDS DINNER MULTI-CLUE RETRIEVAL TEST");
console.log("==========================================================================");

const query = "That photo of me with my college friends having dinner";
const clues: StructuredClues = {
  people: ['me', 'college friends'],
  activities: ['having dinner'],
  visual_tags: ['dinner'],
  category: 'photo'
};

const result = retrievePhotos(query, photos, clues);

console.log(`Query: "${query}"`);
console.log(`Clues:`, JSON.stringify(clues, null, 2));
console.log(`Candidate Count: ${result.candidates.length}`);

console.log("\nTop Candidates:");
result.candidates.forEach((cand, idx) => {
  console.log(`  #${idx + 1}: [${cand.photo.id}] "${cand.photo.title}" | Score: ${cand.score} | Matched: ${cand.matched_clues.join(', ')}`);
});

// Assertions
const topPhoto = result.candidates[0];
const p102 = result.candidates.find(c => c.photo.id === 'photo-102');
const containsIrrelevantBikePhoto = result.candidates.some(c => c.photo.id === 'photo-001' || c.photo.title.includes('Mountain Bike'));

let pass = true;

if (!topPhoto || (topPhoto.photo.id !== 'photo-102' && topPhoto.photo.id !== 'photo-157')) {
  console.error("✗ FAIL: Top photo is not a college friends dinner photo!");
  pass = false;
} else {
  console.log("✓ PASS: Top photo is a college friends dinner photo!");
}

if (containsIrrelevantBikePhoto) {
  console.error("✗ FAIL: Irrelevant bike photo was not filtered out!");
  pass = false;
} else {
  console.log("✓ PASS: Irrelevant bike photos successfully filtered out!");
}

if (result.candidates.length > 20) {
  console.error(`✗ FAIL: Candidate pool size is too broad (${result.candidates.length} items)!`);
  pass = false;
} else {
  console.log(`✓ PASS: Candidate pool size is focused (${result.candidates.length} relevant candidates)!`);
}

console.log("==========================================================================");
if (!pass) {
  process.exit(1);
}
