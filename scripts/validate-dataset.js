const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const photosPath = path.join(rootDir, 'data', 'photos.json');
const tasksPath = path.join(rootDir, 'data', 'benchmark_tasks.json');

console.log("=========================================");
console.log("DATASET VALIDATION SUITE (T-04 COMPLIANCE)");
console.log("=========================================");

if (!fs.existsSync(photosPath)) {
  console.error("ERROR: data/photos.json not found!");
  process.exit(1);
}

if (!fs.existsSync(tasksPath)) {
  console.error("ERROR: data/benchmark_tasks.json not found!");
  process.exit(1);
}

const photos = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

let errors = 0;
let warnings = 0;

// 1. Validate total size
console.log(`\n1. Dataset Size: ${photos.length} photos loaded.`);
if (photos.length !== 100) {
  console.warn(`WARNING: Dataset size ${photos.length} is expected to be exactly 100.`);
  warnings++;
}

// 2. Validate Metadata Schema, Asset Rendering & Provenance
const requiredKeys = ['id', 'filename', 'title', 'description', 'date', 'year', 'month', 'season', 'location', 'people', 'activities', 'objects', 'event', 'category', 'visual_tags', 'ocr_text', 'source', 'license'];
const categories = {};
const licenses = {};

photos.forEach((photo, index) => {
  // Key presence check
  requiredKeys.forEach(key => {
    if (photo[key] === undefined || photo[key] === null) {
      console.error(`ERROR [Item ${index} - ${photo.id}]: Missing field '${key}'`);
      errors++;
    }
  });

  // Location nested object check
  if (!photo.location || typeof photo.location !== 'object' || !photo.location.city) {
    console.error(`ERROR [Item ${index} - ${photo.id}]: Invalid location object.`);
    errors++;
  }

  // Provenance text check
  if (photo.license !== "Original prototype asset — created specifically for this project.") {
    console.error(`ERROR [Item ${index} - ${photo.id}]: Incorrect license description: '${photo.license}'`);
    errors++;
  }

  // File existence & SVG content check
  const filePath = path.join(rootDir, 'public', photo.filename);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR [Item ${index} - ${photo.id}]: Image file missing at '${filePath}'`);
    errors++;
  } else {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    if (!fileContent.includes('<svg') || !fileContent.includes('</svg>')) {
      console.error(`ERROR [Item ${index} - ${photo.id}]: File at '${filePath}' is not a valid SVG.`);
      errors++;
    }
  }

  // Distribution aggregations
  categories[photo.category] = (categories[photo.category] || 0) + 1;
  licenses[photo.license] = (licenses[photo.license] || 0) + 1;
});

console.log(`\n2. Image Asset File Check: ${photos.length - errors}/${photos.length} SVG files verified on disk.`);

// 3. Category & License Distribution
console.log("\n3. Category Distribution:");
Object.keys(categories).forEach(cat => {
  console.log(`   - ${cat}: ${categories[cat]} items`);
});

console.log("\n4. Provenance & License Verification:");
Object.keys(licenses).forEach(lic => {
  console.log(`   - ${lic}: ${licenses[lic]} items`);
});

// 5. Validate Benchmark Scenario Mapping
console.log(`\n5. Benchmark Tasks Validation (${tasks.length} tasks defined):`);
const photoIds = new Set(photos.map(p => p.id));

tasks.forEach(task => {
  console.log(`\n   Task [${task.id}]: "${task.title}"`);
  console.log(`   - Prompt: "${task.prompt}"`);
  
  if (!photoIds.has(task.target_photo_id)) {
    console.error(`   ERROR: Target photo ID '${task.target_photo_id}' does not exist in photos.json!`);
    errors++;
  } else {
    console.log(`   - Target Photo ID '${task.target_photo_id}' verified in photos.json.`);
  }

  // Check for duplicate near-miss IDs
  const nearMisses = task.known_near_miss_ids || [];
  const uniqueNearMisses = new Set(nearMisses);
  if (nearMisses.length !== uniqueNearMisses.size) {
    console.error(`   ERROR: Task '${task.id}' has duplicate near-miss IDs in list:`, nearMisses);
    errors++;
  }

  let missingNearMisses = 0;
  nearMisses.forEach(nmId => {
    if (!photoIds.has(nmId)) {
      console.error(`   ERROR: Near-miss photo ID '${nmId}' does not exist in photos.json!`);
      errors++;
      missingNearMisses++;
    }
  });
  console.log(`   - Near-miss Candidates: ${nearMisses.length} unique items verified (${missingNearMisses} missing).`);

  // Check expected recovery dimensions
  if (!task.expected_recovery_dimensions || task.expected_recovery_dimensions.length === 0) {
    console.error(`   ERROR: Task '${task.id}' missing expected recovery dimensions.`);
    errors++;
  } else {
    console.log(`   - Expected Recovery Dimensions: ${task.expected_recovery_dimensions.join(', ')}`);
  }
});

console.log("\n=========================================");
if (errors === 0) {
  console.log("SUCCESS: All T-04 dataset compliance and validation checks passed cleanly (0 errors).");
} else {
  console.error(`FAILED: ${errors} errors found during T-04 validation.`);
  process.exit(1);
}
