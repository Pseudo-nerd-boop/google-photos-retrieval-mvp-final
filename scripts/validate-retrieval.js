const fs = require('fs');
const path = require('path');

// Register ts-node / transpile on the fly or load compiled output via node
const photosPath = path.join(__dirname, '..', 'data', 'photos.json');
const tasksPath = path.join(__dirname, '..', 'data', 'benchmark_tasks.json');

const photos = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

// Import search engine
const { retrievePhotos, parseRawQueryToClues, evaluateWeakResults } = require('../src/lib/search-engine');

console.log("=========================================");
console.log("RETRIEVAL ENGINE VALIDATION SUITE (T-06)");
console.log("=========================================");

let totalTested = 0;
let targetsFoundInResults = 0;

tasks.forEach((task, idx) => {
  totalTested++;
  console.log(`\n-----------------------------------------`);
  console.log(`BENCHMARK TASK #${idx + 1}: [${task.id}] "${task.title}"`);
  console.log(`User Prompt: "${task.prompt}"`);
  console.log(`Target Photo ID: ${task.target_photo_id}`);

  // Test retrieval using raw query string parsing
  const result = retrievePhotos(task.prompt, photos);
  
  console.log(`Execution Time: ${result.execution_time_ms} ms`);
  console.log(`Total Candidates Returned (> 0 score): ${result.candidates.length}`);
  
  // Find rank of target photo in returned candidates
  const targetRank = result.candidates.findIndex(c => c.photo.id === task.target_photo_id);
  const targetCandidate = result.candidates.find(c => c.photo.id === task.target_photo_id);

  if (targetRank !== -1 && targetCandidate) {
    targetsFoundInResults++;
    console.log(`✓ Target Photo '${task.target_photo_id}' FOUND at Rank #${targetRank + 1} with Score ${targetCandidate.score}`);
    console.log(`   Score Breakdown:`, targetCandidate.score_breakdown);
    console.log(`   Matched Clues: ${targetCandidate.matched_clues.join(', ')}`);
  } else {
    console.log(`✗ Target Photo '${task.target_photo_id}' NOT returned in top candidates.`);
  }

  // Print top 3 candidates
  console.log(`   Top 3 Candidates Returned:`);
  result.candidates.slice(0, 3).forEach((cand, r) => {
    console.log(`     #${r + 1}: ${cand.photo.id} ("${cand.photo.title}") - Score: ${cand.score}`);
  });

  // Weak result evaluation output
  console.log(`   Weak Result Evaluated: ${result.weak_result_eval.is_weak_result ? 'YES' : 'NO'}`);
  console.log(`   Reason Code: ${result.weak_result_eval.reason_code}`);
  console.log(`   Explanation: ${result.weak_result_eval.explanation}`);
});

console.log("\n=========================================");
console.log(`SUMMARY: ${targetsFoundInResults}/${totalTested} target photos retrieved in candidate result sets.`);
console.log("=========================================");
